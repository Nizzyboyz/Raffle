// src/App.js
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import CommunityRaffles from "./communityRaffles";
import { ethers } from "ethers";
import "./Main.css";

// Contract info
import {
  RAFFLE_CONTRACT_ADDRESS,
  RAFFLE_CONTRACT_ABI,
  RAFFLE_FACTORY_ADDRESS,
  RAFFLE_FACTORY_ABI,
} from "./contract";

// Components
import RaffleDetail from "./RaffleDetail";
import CreateRaffle from "./CreateRaffle";

function App() {
  // --------------------------------------------------------
  // Wallet / Connection State
  // --------------------------------------------------------
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  // Read‑only fallback (Polygon mainnet via Alchemy)
  const readOnlyProvider = new ethers.providers.JsonRpcProvider(
    "https://polygon-mainnet.g.alchemy.com/v2/Ddvu7Q1ue3u6HP_LUslVpoG7JzfPhN_7"
  );

  // --------------------------------------------------------
  // Connect / Disconnect Wallet
  // --------------------------------------------------------
  async function fetchBalance(_provider, userAddress) {
    const bal = await _provider.getBalance(userAddress);
    setBalance(ethers.utils.formatEther(bal));
  }

  async function checkNetwork(_provider) {
    const network = await _provider.getNetwork();
    if (network.chainId !== 137) {
      setStatusMessage(
        "Warning: You are not connected to Polygon mainnet. Please switch networks in MetaMask."
      );
    } else {
      setStatusMessage(`Connected to Polygon: ${network.name}`);
    }
  }

  async function connectWallet() {
    if (!window.ethereum) {
      alert("MetaMask not detected. Please install it.");
      return;
    }
    try {
      // Request account access
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const _provider = new ethers.providers.Web3Provider(window.ethereum);
      const _signer = _provider.getSigner();
      const accs = await _provider.listAccounts();
      const userAcc = accs[0] || "";

      setProvider(_provider);
      setSigner(_signer);
      setAccount(userAcc);

      await fetchBalance(_provider, userAcc);
      await checkNetwork(_provider);

      // Listen for account or chain changes
      window.ethereum.on("accountsChanged", async (accs) => {
        if (accs.length > 0) {
          setAccount(accs[0]);
          setStatusMessage(`Account changed: ${accs[0]}`);
          await fetchBalance(_provider, accs[0]);
        } else {
          disconnectWallet();
        }
      });
      window.ethereum.on("chainChanged", () => window.location.reload());

    } catch (err) {
      console.error(err);
      setStatusMessage("User rejected or error occurred while connecting.");
    }
  }

  function disconnectWallet() {
    window.ethereum?.removeAllListeners("accountsChanged");
    window.ethereum?.removeAllListeners("chainChanged");
    setAccount("");
    setBalance("");
    setProvider(null);
    setSigner(null);
    setStatusMessage("Disconnected from wallet");
  }

  // --------------------------------------------------------
  // Fetch raffles from chain
  // --------------------------------------------------------
  const [raffles, setRaffles] = useState([]);
  const [loadingRaffles, setLoadingRaffles] = useState(true);

  useEffect(() => {
    const prov = provider || readOnlyProvider;
    if (!prov) return;

    // 1) Factory for count
    const factory = new ethers.Contract(
      RAFFLE_FACTORY_ADDRESS,
      RAFFLE_FACTORY_ABI,
      prov
    );
    // 2) Raffle contract for data
    const raffleContract = new ethers.Contract(
      RAFFLE_CONTRACT_ADDRESS,
      RAFFLE_CONTRACT_ABI,
      prov
    );

    const SeedCount = 6;

    async function loadRaffles() {
      setLoadingRaffles(true);
      try {
        // a) how many raffles exist?
        const countBN = await factory.getRaffleCount();
        const count = countBN.toNumber();

        const arr = [];
        for (let i = 0; i < count; i++) {
          if (i >= SeedCount) continue;
          // only fetch raffles deployed 
          const [
            nameOfRaffle,
            raffleImg,
            raffleDesc,
            ticketsSoldBN,
            currentPrizeBN,
            timeLeftBN,
            endedBool,
          ] = await raffleContract.getRaffleData(i);

          arr.push({
            id: i,
            name: nameOfRaffle,
            image: raffleImg,
            description: raffleDesc,
            ticketsSold: ticketsSoldBN.toNumber(),
            prize: ethers.utils.formatEther(currentPrizeBN),
            timeLeft: timeLeftBN.toNumber(),
            ended: endedBool,
          });
        }
        setRaffles(arr);
      } catch (err) {
        console.error("Error loading raffles:", err);
        setStatusMessage(
          err.reason || "Error loading raffles. Check console for details."
        );
      } finally {
        setLoadingRaffles(false);
      }
    }

    loadRaffles();
  }, [provider]);

  // --------------------------------------------------------
  // Buy Ticket Logic
  // --------------------------------------------------------
  async function buyTicket(raffleId) {
    if (!signer) {
      setStatusMessage("Please connect your wallet first.");
      return;
    }
    try {
      setStatusMessage(`Buying ticket for Raffle #${raffleId}...`);

      const contract = new ethers.Contract(
        RAFFLE_CONTRACT_ADDRESS,
        RAFFLE_CONTRACT_ABI,
        signer
      );

      // read struct from the public array for that raffle
      const raffleData = await contract.raffles(raffleId);
      const ticketSizeWei = raffleData.ticketSize;
      const numberRange = raffleData.numberRange.toNumber();

      const randomTicketNumber =
        Math.floor(Math.random() * numberRange) + 1;

      const userBal = await signer.getBalance();
      if (userBal.lt(ticketSizeWei)) {
        setStatusMessage("Insufficient MATIC to buy this ticket.");
        return;
      }

      // Estimate gas
      const estimatedGas = await contract.estimateGas.buyTicket(
        raffleId,
        randomTicketNumber,
        { value: ticketSizeWei }
      );
      const gasLimit = estimatedGas.mul(120).div(100);

      // Send transaction
      const tx = await contract.buyTicket(raffleId, randomTicketNumber, {
        value: ticketSizeWei,
        gasLimit,
      });
      await tx.wait();
      setStatusMessage(
        `Ticket purchased (#${randomTicketNumber})! Tx: ${tx.hash}`
      );

    } catch (err) {
      console.error("buyTicket error:", err);

      // Try to parse a more friendly revert reason
      let message = "Transaction failed.";
      if (err.reason) {
        message = `Revert: ${err.reason}`;
      } else if (err.data?.message) {
        message = `Revert: ${err.data.message}`;
      } else if (err.error?.message) {
        message = `Revert: ${err.error.message}`;
      }
      setStatusMessage(message);
    }
  }

  const navigate = useNavigate();

  return (
    <div className="app">
      {/* HEADER */}
      <header>
  {/* ── left block: title + search + new links ───────────── */}
  <div className="header-left">
    <h1>Active Raffles</h1>

    {/* search */}
    <form className="search-container" action="#" method="GET">
      <label htmlFor="search-input" className="visually-hidden">
        Search Raffles
      </label>
      <input
        type="text"
        id="search-input"
        name="q"
        placeholder="Search Raffles..."
        aria-label="Search Raffles"
      />
      <button type="submit" className="search-button" aria-label="Search">
        Go
      </button>
    </form>

    {/* NEW slim links */}
    <nav className="top-nav-links">
      <button
        className="nav-link"
        type="button"
        onClick={() => navigate("/create")}
      >
        Create Raffle
      </button>
      <button
        className="nav-link"
        type="button"
        onClick={() => navigate("/community")}
      >
        User Raffles
      </button>
    </nav>
  </div>

  {/* ── right block: wallet / connect ───────────────────── */}
  <div className="icon-container">
    {account ? (
      <div style={{ marginRight: "20px" }}>
        <p>Wallet: {account}</p>
        <p>Balance: {balance} MATIC</p>
        <button onClick={disconnectWallet}>Disconnect Wallet</button>
      </div>
    ) : (
      <button className="menu-icon" onClick={connectWallet}>
        Connect Wallet
      </button>
    )}
  </div>
</header>


      {/* STATUS MESSAGE */}
      {statusMessage && (
        <div
          style={{
            color: "#fff",
            textAlign: "center",
            marginTop: "10px",
            background: "darkcyan",
            padding: "10px",
          }}
        >
          {statusMessage}
        </div>
      )}

      {/* ROUTES */}
      <Routes>
        <Route
          path="/community"
          element={
            <CommunityRaffles provider={provider || readOnlyProvider} />
          }
        />

        <Route
          path="/"
          element={
            <main>
              {loadingRaffles ? (
                <p style={{ color: "#fff", textAlign: "center" }}>
                  Loading raffles…
                </p>
              ) : (
                <div className="container">
  {raffles.map((r) => (
    <button
      key={r.id}
      className={`box plus ${r.ended ? "raffle-box--ended" : "raffle-box--basic"}`}
      onClick={() => navigate(`/raffle/${r.id}`)}
    >
      <div className="flip-container">
        <div className="front">
          {r.image && <img src={r.image} alt={r.name} className="raffle-image" />}
          <h3>{r.name}</h3>
        </div>

        <div className="back">
          <p>Tickets sold: {r.ticketsSold}</p>
          <p>Prize: {r.prize} MATIC</p>
          {r.ended ? (
            <p style={{ color: "yellow" }}>Ended</p>
          ) : (
            <>
              <p>Time left: {r.timeLeft}s</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  buyTicket(r.id);
                }}
              >
                Buy Ticket
              </button>
            </>
          )}
        </div>
      </div>      
    </button>     
  ))}              
  
</div>
              )}
            </main>
          }
        />

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

        <Route
          path="*"
          element={
            <div style={{ color: "white", textAlign: "center", marginTop: 30 }}>
              <h2>404 - Page Not Found</h2>
            </div>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
