import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import "./RaffleDetails.css";

import {
  RAFFLE_CONTRACT_ADDRESS,
  RAFFLE_CONTRACT_ABI,
  RAFFLE_FACTORY_ADDRESS,
  RAFFLE_FACTORY_ABI,
} from "./contract";

export default function RaffleDetail({ readOnlyProvider, signer, buyTicket, setGlobalStatus }){
  const { id } = useParams();

  // ---------------- state ----------------
  const [data, setData] = useState({
    name: "",
    image: "",
    description: "",
    ticketsSold: 0,
    prize: "0 MATIC",
    timeLeft: "00:00:00",
    ended: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [localMsg, setLocalMsg] = useState("");
  const [buying, setBuying] = useState(false);

  // ---------------- helpers ----------------
  function formatTime(sec) {
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  function ipfs(uri) {
    return uri?.startsWith("ipfs://") ? uri.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/") : uri;
  }

  // ---------------- fetch raffle ----------------
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const provider =
          readOnlyProvider ||
          new ethers.providers.JsonRpcProvider("https://polygon-mainnet.g.alchemy.com/v2/Ddvu7Q1ue3u6HP_LUslVpoG7JzfPhN_7");
        const rc = new ethers.Contract(RAFFLE_CONTRACT_ADDRESS, RAFFLE_CONTRACT_ABI, provider);
        const {
          nameOfRaffle,
          raffleImg,
          raffleDesc,
          ticketsSold: ticketsBN,
          currentPrize: prizeBN,
          timeLeft: tlBN,
          ended: endedBool,
        } = await rc.getRaffleData(id);

        setData({
          name: nameOfRaffle,
          image: ipfs(raffleImg),
          description: raffleDesc,
          ticketsSold: ticketsBN.toNumber(),
          prize: `${ethers.utils.formatEther(prizeBN)} MATIC`,
          timeLeft: formatTime(tlBN.toNumber()),
          ended: endedBool,
        });
      } catch (e) {
        console.error(e);
        setError("Failed to load raffle details");
      }
      setLoading(false);
    }
    load();
  }, [id, readOnlyProvider]);

  //
  const [creationFee, setCreationFee] = useState("0");
  const [isOwner, setIsOwner] = useState(false);

  // Fetch the creationFee once on mount
  useEffect(() => {
    (async () => {
      try {
        const prov = readOnlyProvider ||
          new ethers.providers.JsonRpcProvider();
        const factory = new ethers.Contract(
          RAFFLE_FACTORY_ADDRESS,
          RAFFLE_FACTORY_ABI,
          prov
        );
        const feeBN = await factory.creationFee();
        setCreationFee(feeBN.toString());
      } catch (e) {
        console.error("Failed to fetch factory creationFee:", e);
      }
    })();
  }, [readOnlyProvider]);

  // Restart Button:
   {isOwner && Number(id) < 6 && (
        <button
  className="restart-btn"
  onClick={async () => {
    const input = prompt("New duration in seconds?");
    const dur = Number(input);
    if (!dur || dur < 1) return alert("Invalid duration");

    try {
      setGlobalStatus?.("Restarting raffle…");
      const factory = new ethers.Contract(
        RAFFLE_FACTORY_ADDRESS,
        RAFFLE_FACTORY_ABI,
        signer
      );
      const tx = await factory.restartRaffle(
        Number(id),
        dur,
        { value: creationFee }   // now defined!
      );
      await tx.wait();
      setGlobalStatus?.("Raffle restarted!");
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Restart failed: " + (e.reason || e.message));
    }
  }}
>
  Restart Raffle
</button>
      )}

  // auto‑clear local message
  useEffect(() => {
    if (!localMsg) return;
    const t = setTimeout(() => setLocalMsg(""), 8000);
    return () => clearTimeout(t);
  }, [localMsg]);

  // ---------------- buy ticket ----------------
  async function handleBuyTicket() {
    if (!signer) {
      const msg = "Connect your wallet first.";
      setLocalMsg(msg);
      setGlobalStatus?.(msg);
      return;
    }
    buyTicket(Number(id));
  }
   

  // ---------------- render ----------------
  if (loading) return <p style={{ color: "#fff" }}>Loading…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div className="raffle-detail">
      {/* left column */}
      <aside className="raffle-left">
        {data.image && <img src={data.image} alt={data.name} className="raffle-img" />}        
        <h2 className="raffle-title">{data.name}</h2>
          <button
          className="buy-btn"
          disabled={data.ended}
          onClick={handleBuyTicket}
        >
          {data.ended ? "Raffle Ended" : "Buy Ticket"}
        </button>
      </aside>

      {/* right column */}
      <section className="raffle-right">
        <p className="raffle-desc">{data.description}</p>

        <div className="stats-bar">
          <div className="stat">
            <span className="stat-label">Tickets Sold</span>
            <span className="stat-value">{data.ticketsSold}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Current Prize</span>
            <span className="stat-value">{data.prize}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Time Left</span>
            <span className="stat-value">{data.timeLeft}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Ended</span>
            <span className="stat-value">{data.ended ? "Yes" : "No"}</span>
          </div>
        </div>

        {localMsg && <div className="local-msg">{localMsg}</div>}
      </section>
    </div>
  );
}