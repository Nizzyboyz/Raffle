import React from "react";
import "../Main.css";

export default function TopBar({ account, connectWallet, disconnectWallet }) {
  return (
    <header className="topbar">
      {/* left-side greeting */}
      <span className="greeting">
        {account
          ? `GM, ${account.slice(0, 6)}…${account.slice(-4)} 👋`
          : "Welcome !! 👋"}
      </span>

      {/* right-side wallet button */}
      {account ? (
        <button className="wallet-btn" onClick={disconnectWallet}>
          Disconnect
        </button>
      ) : (
        <button className="wallet-btn" onClick={connectWallet}>
          Connect Wallet
        </button>
      )}
    </header>
  );
}
