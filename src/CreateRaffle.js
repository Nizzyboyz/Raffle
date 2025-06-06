// src/CreateRaffle.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import "./CreateRaffle.css";

// RaffleFactory info
import {
  RAFFLE_FACTORY_ADDRESS,
  RAFFLE_FACTORY_ABI,
} from "./contract";

function CreateRaffle({ signer, provider, setStatusMessage }) {
  const navigate = useNavigate();

  // ----------------------------------------------
  // Form fields (the four settings + metadata)
  // ----------------------------------------------
  const [ticketSizeMatic, setTicketSizeMatic] = useState("");
  const [numberRange, setNumberRange]         = useState("");
  const [houseTake, setHouseTake]             = useState("");
  const [raffleDuration, setRaffleDuration]   = useState("");

  // Metadata fields
  const [raffleName, setRaffleName]   = useState("");
  const [raffleImage, setRaffleImage] = useState("");
  const [raffleDesc, setRaffleDesc]   = useState("");

  // Creation fee from factory (in Wei)
  const [creationFee, setCreationFee] = useState("0");
  const [loadingFee, setLoadingFee]   = useState(false);
  const [nativePriceUSD, setNativePriceUSD] = useState(null);

  function updateStatus(msg) {
    if (setStatusMessage) {
      setStatusMessage(msg);
    } else {
      console.log("[CreateRaffle] " + msg);
    }
  }

  // ----------------------------------------------------------
  // On mount: fetch the factory's creationFee and MATIC→USD
  // ----------------------------------------------------------
  useEffect(() => {
    fetchCreationFee();
    fetch("https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd")
      .then((res) => res.json())
      .then((data) => {
        setNativePriceUSD(data["matic-network"].usd);
      })
      .catch(console.error);
  }, []);

  async function fetchCreationFee() {
    setLoadingFee(true);
    try {
      const _provider =
        provider ||
        new ethers.providers.JsonRpcProvider(
          "https://polygon-mainnet.g.alchemy.com/v2/3V4Ph7BR2nsUxGVCYwiLQoh3wOl1Q9R5"
        );
      const factoryContract = new ethers.Contract(
        RAFFLE_FACTORY_ADDRESS,
        RAFFLE_FACTORY_ABI,
        _provider
      );
      const feeBN = await factoryContract.creationFee();
      setCreationFee(feeBN.toString());
    } catch (err) {
      console.error("Error fetching creation fee:", err);
    }
    setLoadingFee(false);
  }

  // ----------------------------------------------------------
  // On form submit: create a new raffle
  // ----------------------------------------------------------
  async function handleCreate(e) {
    e.preventDefault();

    if (!signer) {
      return updateStatus("Please connect your wallet first.");
    }

    try {
      updateStatus("Creating raffle...");

      const factoryContract = new ethers.Contract(
        RAFFLE_FACTORY_ADDRESS,
        RAFFLE_FACTORY_ABI,
        signer
      );

      // Convert ticketSize from MATIC to Wei
      const ticketSizeWei = ethers.utils.parseEther(ticketSizeMatic || "0");

      // Build settings object
      const settings = {
        ticketSize: ticketSizeWei.toString(),
        numberRange: numberRange || "0",
        houseTake: houseTake || "0",
        raffleDuration: 0, // will be overwritten by the next param
      };

      // Call the factory
      const tx = await factoryContract.createNewRaffle(
        settings,
        raffleName,
        raffleImage,
        raffleDesc,
        parseInt(raffleDuration, 10),
        {
          value: creationFee || "0",
        }
      );

      updateStatus("Tx sent. Waiting for confirmation...");
      await tx.wait();

      updateStatus(`Raffle Created! Tx: ${tx.hash}`);
      navigate("/");
    } catch (err) {
      console.error("handleCreate error:", err);
      let msg = "Transaction failed or rejected.";
      if (err.reason) {
        msg = `Transaction failed: ${err.reason}`;
      } else if (err.data?.message) {
        msg = `Transaction failed: ${err.data.message}`;
      }
      updateStatus(msg);
    }
  }

  // ----------------------------------------------------------
  // Compute USD equivalent for the creation fee
  // ----------------------------------------------------------
  let feeInMatic = 0;
  if (creationFee) {
    feeInMatic = parseFloat(ethers.utils.formatEther(creationFee));
  }
  let feeInUSD = null;
  if (nativePriceUSD !== null && nativePriceUSD !== undefined) {
    feeInUSD = (feeInMatic * nativePriceUSD).toFixed(2);
  }
  let usdDisplay = null;
  if (feeInUSD) {
    usdDisplay = <> (≈ ${feeInUSD})</>;
  }

  // ----------------------------------------------------------
  // Render
  // ----------------------------------------------------------
  return (
    <div className="create-raffle-container">
      <h2>Create a New Raffle</h2>

      <form className="create-raffle-form" onSubmit={handleCreate}>
        {/* Raffle Name */}
        <label>
          Raffle Name:
          <input
            type="text"
            value={raffleName}
            onChange={(e) => setRaffleName(e.target.value)}
            required
            placeholder="Enter a name"
          />
        </label>

        {/* Raffle Description */}
        <label>
          Raffle Description:
          <textarea
            rows={3}
            value={raffleDesc}
            onChange={(e) => setRaffleDesc(e.target.value)}
            placeholder="Short description"
          />
        </label>

        {/* Ticket Price (MATIC) */}
        <label>
          Ticket Price (MATIC):
          <input
            type="text"
            placeholder="e.g. 0.001"
            value={ticketSizeMatic}
            onChange={(e) => setTicketSizeMatic(e.target.value)}
            required
          />
        </label>

        {/* Number Range */}
        <label>
          Number Range:
          <input
            type="number"
            placeholder="Max ticket number (e.g. 1000)"
            value={numberRange}
            onChange={(e) => setNumberRange(e.target.value)}
            required
          />
        </label>

        {/* House Take (%) */}
        <label>
          House Take (%):
          <input
            type="number"
            placeholder="0 to 100"
            value={houseTake}
            onChange={(e) => setHouseTake(e.target.value)}
            required
          />
        </label>

        {/* Raffle Duration */}
        <label>
          Raffle Duration (sec):
          <input
            type="number"
            placeholder="e.g. 86400 for 1 day"
            value={raffleDuration}
            onChange={(e) => setRaffleDuration(e.target.value)}
            required
          />
        </label>

        {/* Raffle Image URL */}
        <label>
          Raffle Image (URI):
          <input
            type="text"
            value={raffleImage}
            onChange={(e) => setRaffleImage(e.target.value)}
            placeholder="ipfs://... or https://..."
          />
        </label>

        {/* Creation Fee Display */}
        <div className="creation-fee-label">
          {loadingFee ? (
            "Loading creation fee…"
          ) : (
            <>
              <strong>Creation Fee:</strong> 
              {feeInMatic.toFixed(4)} MATIC
              {usdDisplay}
            </>
          )}
        </div>

        {/* Button Row */}
        <div className="create-raffle-buttons">
          <button type="submit">Create Raffle</button>
          <button
            type="button"
            className="cancel-btn"
            onClick={() => navigate("/")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateRaffle;
