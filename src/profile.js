import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Link } from "react-router-dom";
import { Wallet } from "lucide-react";        
import "./Main.css";

import {
  RAFFLE_CONTRACT_ADDRESS,
  RAFFLE_CONTRACT_ABI,
  RAFFLE_FACTORY_ADDRESS,
  RAFFLE_FACTORY_ABI,
} from "./contract";

export default function Profile({ account, provider, connectWallet }) {
  const [balance, setBalance] = useState("");
  const [tickets, setTickets] = useState([]);
  const [created, setCreated] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ───────── DATA LOAD ───────── */
  useEffect(() => {
    if (!account || !provider) return;

    async function loadProfile() {
      setLoading(true);

      /** 1 ▸ Wallet balance **/
      const balWei = await provider.getBalance(account);
      setBalance(ethers.utils.formatEther(balWei));

      /** 2 ▸ Tickets you bought **/
      const raffle = new ethers.Contract(
        RAFFLE_CONTRACT_ADDRESS,
        RAFFLE_CONTRACT_ABI,
        provider
      );

      const buyFilter = raffle.filters.TicketPurchased(null, account);
      const buyEvents = await raffle.queryFilter(buyFilter);

      const ticketRows = await Promise.all(
        buyEvents.map(async (ev) => {
          const raffleId     = ev.args[0].toNumber();
          const ticketNumber = ev.args[2].toNumber();
          const [raffleName] = await raffle.getRaffleData(raffleId);

          return {
            id: raffleId,
            name: raffleName,
            ticket: ticketNumber,
            tx: ev.transactionHash,
          };
        })
      ).then((rows) => rows.reverse());

      /** 3 ▸ Raffles you created **/
      const factory = new ethers.Contract(
        RAFFLE_FACTORY_ADDRESS,
        RAFFLE_FACTORY_ABI,
        provider
      );
      const createdIds = await factory.getRafflesCreatedBy(account);

      const mini = await Promise.all(
        createdIds.map(async (idBN) => {
          const id = idBN.toNumber();
          const [name, , , , , , ended] = await raffle.getRaffleData(id);
          return { id, name, ended };
        })
      ).then((rows) => rows.reverse());

      setTickets(ticketRows);
      setCreated(mini);
      setLoading(false);
    }

    loadProfile();
  }, [account, provider]);

  /* ───────── EARLY RETURNS ───────── */
  if (!account) {
    return (
      <div className="connect-placeholder">
        <Wallet size={120} stroke="#5667ff" strokeWidth={1.4} />
        <button className="connect-btn" onClick={connectWallet}>
          CONNECT WALLET
        </button>
      </div>
    );
  }

  if (loading) {
    return <p style={{ textAlign: "center" }}>Loading profile…</p>;
  }

  /* ───────── MARKUP ───────── */
  return (
    <div className="profile">
      <h2>Your Profile</h2>

      {/* balance */}
      <section className="profile-section">
        <h3>Wallet balance</h3>
        <p>{balance} MATIC</p>
      </section>

      {/* raffles created */}
      <section className="profile-section">
        <h3>Raffles you created</h3>
        {created.length === 0 ? (
          <p>None yet.</p>
        ) : (
          <ul className="created-list">
            {created.map((r) => (
              <li key={r.id} className="created-item">
                <Link to={`/raffle/${r.id}`} className="created-link">
                  {r.name}
                </Link>
                <span
                  className={`status-pill ${
                    r.ended ? "status-ended" : "status-active"
                  }`}
                >
                  {r.ended ? "Ended" : "Active"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* tickets bought */}
      <section className="profile-section">
        <h3>Tickets you bought</h3>
        {tickets.length === 0 ? (
          <p>No tickets purchased yet.</p>
        ) : (
          <div className="ticket-grid">
            {tickets.map((t, i) => (
              <div key={i} className="ticket-card">
                <Link to={`/raffle/${t.id}`} className="ticket-title">
                  {t.name}
                </Link>
                <p className="ticket-number">Ticket # {t.ticket}</p>
                <a
                  href={`https://polygonscan.com/tx/${t.tx}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ticket-link"
                >
                  view tx
                </a>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
