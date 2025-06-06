import React from "react";

/**
 * Top navigation bar (Polymarket‑style)
 * Props:
 *   query         – current search string
 *   setQuery(str) – updates search
 *   account       – wallet address (empty string if not connected)
 *   connectWallet – fn to trigger MetaMask connection
 *   disconnect    – fn to disconnect
 *   balance       – MATIC balance (optional)
 */
export default function MainNav({
  query,
  setQuery,
  account,
  connectWallet,
  disconnect,
  balance,
}) {
  return (
    <header className="sticky top-0 z-40 bg-bg/80 backdrop-blur border-b border-border">
      <div className="max-w-7xl mx-auto flex items-center gap-4 px-6 py-3">
        {/* logo */}
        <div className="flex items-center gap-2 text-white font-semibold text-lg">
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M5 12h14" />
          </svg>
        </div>

        {/* search */}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search raffles…"
          className="flex-1 bg-card border border-border rounded-xl py-2 pl-4 text-white
                     placeholder-slate focus:outline-none focus:ring-2 focus:ring-accent"
        />

        {/* wallet */}
        {account ? (
          <div className="hidden sm:block text-right text-slate text-sm">
            <span className="font-mono truncate block max-w-[120px] text-white">
              {account}
            </span>
            {balance && <span>{balance}&nbsp;MATIC</span>}
            <button
              onClick={disconnect}
              className="mt-1 px-3 py-1 rounded-xl bg-accent text-bg font-semibold hover:bg-opacity-90"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            className="px-4 py-2 rounded-xl bg-accent text-bg font-semibold hover:bg-opacity-90"
          >
            Connect
          </button>
        )}
      </div>

      {/* pill nav (static links for now) */}
      <nav className="w-full border-b border-border overflow-x-auto">
        <ul className="flex gap-4 px-6 py-2 whitespace-nowrap text-slate text-sm">
          {["Trending", "Create Your Own Raffle", "View Raffles"].map((tab) => (
            <li key={tab}>
              <button className="px-3 py-1.5 rounded-full hover:bg-card hover:text-white">
                {tab}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
