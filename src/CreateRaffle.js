import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import { RAFFLE_FACTORY_ADDRESS, RAFFLE_FACTORY_ABI } from "./contract";
import "./Main.css";          // << we’ll add wizard styles there

export default function CreateRaffle({ signer, provider, setStatusMessage }) {
  const nav = useNavigate();

  /* ------------- chain values ------------- */
  const [creationFee, setCreationFee] = useState("0");
  const [feeUSD,       setFeeUSD]      = useState("");
  const [loadingFee,   setLoadingFee]  = useState(true);

  useEffect(() => {
    (async () => {
      /* fetch fee */
      const prov = provider ?? new ethers.providers.JsonRpcProvider(
        "https://polygon-mainnet.g.alchemy.com/v2/Ddvu7Q1ue3u6HP_LUslVpoG7JzfPhN_7"
      );
      const fac  = new ethers.Contract(
        RAFFLE_FACTORY_ADDRESS,
        RAFFLE_FACTORY_ABI,
        prov
      );
      const fee  = await fac.creationFee();
      setCreationFee(fee.toString());

      /* usd price */
      try {
        const { ["matic-network"]: { usd } } =
          await fetch("https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd")
            .then(r => r.json());
        setFeeUSD((parseFloat(ethers.utils.formatEther(fee)) * usd).toFixed(2));
      } catch (_) { /* ignore */ }
      setLoadingFee(false);
    })();
  }, []);

  /* ------------- form state ------------- */
  const [form, setForm] = useState({
    name:"", desc:"", image:"",
    ticket:"", range:"", take:"", duration:""
  });

  function update(k, v){ setForm({ ...form, [k]:v }); }

  /* ------------- wizard state ------------- */
  const steps = ["Basics","Pricing","Rules","Media","Confirm"];
  const [step, setStep] = useState(0);
  const pct  = ((step+1)/steps.length)*100;

  /* ------------- submit ------------- */
  async function handleSubmit(){
    if (!signer) { setStatusMessage?.("Connect wallet first"); return; }

    const settings = {
      ticketSize: ethers.utils.parseEther(form.ticket || "0").toString(),
      numberRange: form.range,
      houseTake:   form.take,
      raffleDuration: 0               // overwritten by param
    };

    try{
      const fac = new ethers.Contract(
        RAFFLE_FACTORY_ADDRESS, RAFFLE_FACTORY_ABI, signer
      );
      const tx = await fac.createNewRaffle(
        settings, form.name, form.image, form.desc, parseInt(form.duration,10),
        { value: creationFee }
      );
      setStatusMessage?.("Tx sent…");
      await tx.wait();
      setStatusMessage?.("Raffle created!");
      nav("/");
    }catch(e){
      console.error(e);
      setStatusMessage?.("Tx failed – see console");
    }
  }

  /* ------------- render ------------- */
  return (
    
    <div className="wizard-wrap">
      {/* progress bar */}
      <div className="wizard-progress">
        <div style={{ width:`${pct}%` }} />
      </div>

      {/* slides container */}
      <div
        className="wizard-slider"
        style={{ transform:`translateX(-${step*100}%)` }}
      >
        {/* ----- STEP 0: basics ----- */}
        <div className="wizard-slide">
          <h2>Step 1 / 5 — Basics</h2>
          <label>Raffle name
            <input value={form.name} onChange={e=>update("name",e.target.value)} />
          </label>
          <label>Description
            <textarea rows={3} value={form.desc}
              onChange={e=>update("desc",e.target.value)} />
          </label>
        </div>

        {/* ----- STEP 1: pricing ----- */}
        <div className="wizard-slide">
          <h2>Step 2 / 5 — Pricing</h2>
          <label>Ticket price (MATIC)
            <input value={form.ticket}
                   onChange={e=>update("ticket",e.target.value)} />
          </label>
          <label>House take %
            <input value={form.take}
                   onChange={e=>update("take",e.target.value)} />
          </label>
        </div>

        {/* ----- STEP 2: rules ----- */}
        <div className="wizard-slide">
          <h2>Step 3 / 5 — Rules</h2>
          <label>Number range (max ticket #)
            <input value={form.range}
                   onChange={e=>update("range",e.target.value)} />
          </label>
          <label>Duration (seconds)
            <input value={form.duration}
                   onChange={e=>update("duration",e.target.value)} />
          </label>
        </div>

        {/* ----- STEP 3: media ----- */}
        <div className="wizard-slide">
          <h2>Step 4 / 5 — Image</h2>
          <label>Image URL (ipfs or https)
            <input value={form.image}
                   onChange={e=>update("image",e.target.value)} />
          </label>
        </div>

        {/* ----- STEP 4: confirm ----- */}
        <div className="wizard-slide">
          <h2>Step 5 / 5 — Review & Pay</h2>
          <ul className="confirm-list">
            <li><strong>Name:</strong> {form.name}</li>
            <li><strong>Ticket:</strong> {form.ticket} MATIC</li>
            <li><strong>Range:</strong> 1 – {form.range}</li>
            <li><strong>Duration:</strong> {form.duration}s</li>
            <li><strong>Creation fee:</strong> {loadingFee
              ? "…" : `${ethers.utils.formatEther(creationFee)} MATIC (${feeUSD}$)`}</li>
          </ul>
        </div>
      </div>

      {/* nav buttons */}
      <div className="wizard-nav">
        {step > 0 && (
          <button className="wizard-back" onClick={()=>setStep(s=>s-1)}>
            Back
          </button>
        )}

        {step < steps.length-1 ? (
          <button
            className="wizard-next"
            disabled={!form.name && step===0}
            onClick={()=>setStep(s=>s+1)}
          >
            Next
          </button>
        ) : (
          <button className="wizard-submit" onClick={handleSubmit}>
            Create Raffle
          </button>
        )}
      </div>
    </div>
  );
}
