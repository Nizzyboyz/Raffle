import React from "react";

/**
 * Polymarket‑style raffle card
 * Props:
 *   r          – raffle object { id, name, image, ticketsSold, prize, timeLeft, ended }
 *   onOpen(id) – open detail page
 *   onBuy(id)  – buy ticket
 */
export default function RaffleCard({ r, onOpen, onBuy }) {
  return (
    <button
      onClick={() => onOpen(r.id)}
      className={`flex flex-col p-4 rounded-xl2 bg-card shadow-card border border-border
                  hover:shadow-lg transition ${r.ended && "opacity-60 cursor-not-allowed"}`}
    >
      {/* thumbnail */}
      {r.image ? (
        <img src={r.image} alt={r.name} className="h-24 w-full rounded-lg object-cover" />
      ) : (
        <div className="h-24 w-full rounded-lg bg-border flex items-center justify-center text-slate">
          No image
        </div>
      )}

      {/* title */}
      <h3 className="mt-3 text-white text-base font-semibold leading-tight">{r.name}</h3>

      {/* stats */}
      <div className="mt-2 text-xs text-slate space-y-0.5 leading-5 flex-1">
        <p><b>Tickets</b> {r.ticketsSold}</p>
        <p><b>Prize</b> {r.prize} MATIC</p>
        {!r.ended && <p><b>Time</b> {r.timeLeft}s</p>}
      </div>

      {/* actions */}
      {!r.ended && (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={e => { e.stopPropagation(); onBuy(r.id); }}
            className="py-1.5 rounded-lg bg-accent text-bg text-sm font-semibold hover:bg-opacity-90"
          >
            Buy Ticket
          </button>
          <button
            onClick={e => e.stopPropagation()}
            className="py-1.5 rounded-lg bg-danger/80 text-bg text-sm font-semibold hover:bg-danger"
          >
            Sell
          </button>
        </div>
      )}
    </button>
  );
}
