
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import "./Main.css";

// ABI + addresses
import {
  RAFFLE_CONTRACT_ADDRESS,
  RAFFLE_CONTRACT_ABI,
  RAFFLE_FACTORY_ADDRESS,
  RAFFLE_FACTORY_ABI,
} from "./contract";

// Number of migration‐seeded raffles to skip
const SEED_COUNT = 6;

export default function CommunityRaffles({ provider }) {
  const navigate = useNavigate();
  const [raffles, setRaffles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!provider) return;

    const factory = new ethers.Contract(
      RAFFLE_FACTORY_ADDRESS,
      RAFFLE_FACTORY_ABI,
      provider
    );
    const raffleContract = new ethers.Contract(
      RAFFLE_CONTRACT_ADDRESS,
      RAFFLE_CONTRACT_ABI,
      provider
    );

    async function loadCommunityRaffles() {
      setLoading(true);
      setError("");

      try {
        // 1) How many total raffles in factory?
        const totalBN = await factory.getRaffleCount();
        const total = totalBN.toNumber();

        const arr = [];
        // 2) Loop from SEED_COUNT to total − 1
        for (let i = SEED_COUNT; i < total; i++) {
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
      } catch (e) {
        console.error("loadCommunityRaffles error:", e);
        setError("Failed to load community raffles.");
      } finally {
        setLoading(false);
      }
    }

    loadCommunityRaffles();
  }, [provider]);

  if (loading) {
    return <p style={{ color: "#fff", textAlign: "center" }}>Loading…</p>;
  }
  if (error) {
    return <p style={{ color: "red", textAlign: "center" }}>{error}</p>;
  }
  if (raffles.length === 0) {
    return (
      <p style={{ color: "#fff", textAlign: "center", marginTop: "2rem" }}>
        No community raffles found.
      </p>
    );
  }

  return (
    <div style={{ padding: "20px", color: "#fff" }}>
      <h2 style={{ textAlign: "center" }}>Community‐Created Raffles</h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "20px",
          marginTop: "1rem",
        }}
      >
        {raffles.map((r) => (
          <div
            key={r.id}
            className="community‐raffle‐card"
            onClick={() => navigate(`/raffle/${r.id}`)}
            style={{
              background: "#fff",
              color: "#000",
              borderRadius: "8px",
              padding: "16px",
              cursor: "pointer",
              position: "relative",
              minHeight: "200px",
            }}
          >
            <h3 style={{ marginBottom: "8px" }}>{r.name}</h3>
            <p style={{ fontSize: "14px", marginBottom: "12px" }}>
              Tickets sold: {r.ticketsSold}
            </p>
            <p style={{ fontSize: "14px", marginBottom: "12px" }}>
              Prize: {r.prize} MATIC
            </p>
            <p style={{ fontSize: "14px", marginBottom: "12px" }}>
              Time left: {r.timeLeft}s
            </p>
            {r.ended && (
              <span
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background: "yellow",
                  color: "#000",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                Ended
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
