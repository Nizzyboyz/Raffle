// src/App.js
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import "./Main.css";

/* ─── Contract info ─── */
import {
  RAFFLE_CONTRACT_ADDRESS,
  RAFFLE_CONTRACT_ABI,
  RAFFLE_FACTORY_ADDRESS,
  RAFFLE_FACTORY_ABI,
} from "./contract";

/* ─── Components ─── */
import RaffleDetail from "./RaffleDetail";
import CreateRaffle from "./CreateRaffle";
import TopBar       from "./components/topbar";
import Sidebar      from "./components/sidebar";
import Profile      from "./profile";        // ⬅ (capital P)

/* ────────────────────────────────────────────────────────── */
function App() {
  /* ▸ Wallet state */
  const [provider, setProvider]   = useState(null);
  const [signer,   setSigner]     = useState(null);
  const [account,  setAccount]    = useState("");
  const [balance,  setBalance]    = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  /* ▸ Fallback read-only provider */
  const readOnlyProvider = new ethers.providers.JsonRpcProvider(
    "https://polygon-mainnet.g.alchemy.com/v2/Ddvu7Q1ue3u6HP_LUslVpoG7JzfPhN_7"
  );

  /* ▸ Helper: seconds → “2h 15m” */
  function formatTime(sec) {
  const d = Math.floor(sec / 86400);
  if (d) return `${d}d`;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h ? `${h}h ${m}m` : `${sec % 60}s`;
}

  /* ───────── Wallet connect / disconnect ───────── */
  async function fetchBalance(_provider, userAddr) {
    const balWei = await _provider.getBalance(userAddr);
    setBalance(ethers.utils.formatEther(balWei));
  }

  async function checkNetwork(_provider) {
    const net = await _provider.getNetwork();
    if (net.chainId !== 137) {
      setStatusMessage("Warning: switch to Polygon mainnet.");
    } else {
      setStatusMessage(`Connected to Polygon: ${net.name}`);
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask not detected.");
      return;
    }
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const _provider = new ethers.providers.Web3Provider(window.ethereum);
      const _signer   = _provider.getSigner();
      const [addr]    = await _provider.listAccounts();

      setProvider(_provider);
      setSigner(_signer);
      setAccount(addr);

      await fetchBalance(_provider, addr);
      await checkNetwork(_provider);

      window.ethereum.on("accountsChanged", async (accs) => {
        if (accs.length) {
          setAccount(accs[0]);
          await fetchBalance(_provider, accs[0]);
        } else {
          disconnectWallet();
        }
      });
      window.ethereum.on("chainChanged", () => window.location.reload());
    } catch (err) {
      console.error(err);
      setStatusMessage("Wallet connection cancelled / failed.");
    }
  }

  function disconnectWallet() {
    window.ethereum?.removeAllListeners("accountsChanged");
    window.ethereum?.removeAllListeners("chainChanged");
    setAccount("");
    setBalance("");
    setProvider(null);
    setSigner(null);
    setStatusMessage("Disconnected");
  }

  /* ───────── Fetch raffles ───────── */
  const [raffles, setRaffles]       = useState([]);
  const [loadingRaffles, setLoading] = useState(true);

  useEffect(() => {
    const prov = provider || readOnlyProvider;
    if (!prov) return;

    const factory = new ethers.Contract(
      RAFFLE_FACTORY_ADDRESS,
      RAFFLE_FACTORY_ABI,
      prov
    );
    const raffleC = new ethers.Contract(
      RAFFLE_CONTRACT_ADDRESS,
      RAFFLE_CONTRACT_ABI,
      prov
    );

    async function load() {
      setLoading(true);
      try {
        const count = (await factory.getRaffleCount()).toNumber();
        const arr   = [];
        for (let i = 0; i < count; i++) {
          const [
            name, img, desc,
            soldBN, prizeBN, timeBN, ended
          ] = await raffleC.getRaffleData(i);

          arr.push({
            id: i,
            name,
            image: img,
            description: desc,
            ticketsSold: soldBN.toNumber(),
            prize: ethers.utils.formatEther(prizeBN),
            timeLeft: timeBN.toNumber(),
            ended
          });
        }
        setRaffles(arr);
      } catch (e) {
        console.error(e);
        setStatusMessage("Error loading raffles (see console).");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [provider]);

  /* ▸ Buy ticket */
  async function buyTicket(raffleId) {
    if (!signer) { setStatusMessage("Connect wallet first."); return; }
    try {
      const contract = new ethers.Contract(
        RAFFLE_CONTRACT_ADDRESS,
        RAFFLE_CONTRACT_ABI,
        signer
      );
      const data = await contract.raffles(raffleId);
      const ticketSize = data.ticketSize;
      const range      = data.numberRange.toNumber();

      const num   = Math.floor(Math.random() * range) + 1;
      const bal   = await signer.getBalance();
      if (bal.lt(ticketSize)) {
        setStatusMessage("Insufficient MATIC.");
        return;
      }
      const gasEst = await contract.estimateGas.buyTicket(
        raffleId, num, { value: ticketSize }
      );
      const tx = await contract.buyTicket(
        raffleId, num,
        { value: ticketSize, gasLimit: gasEst.mul(120).div(100) }
      );
      await tx.wait();
      setStatusMessage(`Ticket #${num} bought!`);
    } catch (err) {
      console.error(err);
      setStatusMessage("Tx failed – see console.");
    }
  }

  const navigate = useNavigate();

  /* ───────── JSX ───────── */
  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-content">
        <TopBar
          account={account}
          connectWallet={connectWallet}
          disconnectWallet={disconnectWallet}
        />

        {statusMessage && (
          <div className="status-banner">{statusMessage}</div>
        )}

        <Routes>
          {/* HOME / OVERVIEW */}
          <Route
            path="/"
            element={
              loadingRaffles ? (
                <p style={{ textAlign: "center", color: "#fff" }}>
                  Loading raffles…
                </p>
              ) : (
                <div className="container">
                  {raffles.map((r) => (
                    <div
                      key={r.id}
                      className={`raffle-card ${r.ended ? "raffle-ended" : ""}`}
                      onClick={() => navigate(`/raffle/${r.id}`)}
                    >
                      {/* header */}
                      <div className="raffle-header">
                        <img
                          src={r.image || "/placeholder.png"}
                          alt={r.name}
                          className="raffle-thumb"
                        />
                        <h3 className="raffle-name">{r.name}</h3>
                      </div>

                      {/* stats */}
                      <p className="raffle-price">{r.prize} MATIC</p>
                      <p className="raffle-time">
                        {r.ended ? "Ended" : `${formatTime(r.timeLeft)} left`}
                      </p>

                      {!r.ended && (
                        <button
                          className="raffle-buy"
                          onClick={(e) => {
                            e.stopPropagation();
                            buyTicket(r.id);
                          }}
                        >
                          Buy
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )
            }
          />

          {/* SINGLE RAFFLE */}
          <Route
            path="/raffle/:id"
            element={
              <RaffleDetail
                readOnlyProvider={provider || readOnlyProvider}
                signer={signer}
                buyTicket={buyTicket}
                setGlobalStatus={setStatusMessage}
              />
            }
          />

          {/* CREATE RAFFLE */}
          <Route
            path="/create"
            element={
              <CreateRaffle
                signer={signer}
                provider={provider || readOnlyProvider}
                setStatusMessage={setStatusMessage}
              />
            }
          />

          {/* PROFILE */}
          <Route
            path="/profile"
            element={
              <Profile
                account={account}
                provider={provider || readOnlyProvider}
                connectWallet={connectWallet}
              />
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={
              <div style={{ textAlign: "center", color: "#fff", marginTop: 40 }}>
                404 – Page Not Found
              </div>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
