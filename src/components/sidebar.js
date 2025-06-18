import React from "react";
import { NavLink } from "react-router-dom";
import { X as IconX, Gamepad2, Globe } from "lucide-react";
import "../Main.css";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* logo / brand */}
      <h2 className="logo">Raffles</h2>

      {/* main navigation */}
      <nav className="menu">
        <NavLink end to="/"        className="menu__item">Overview</NavLink>
        <NavLink to="/profile"     className="menu__item">Profile</NavLink>
        <NavLink to="/create"      className="menu__item">Create Raffle</NavLink>
        <NavLink to="/trends"      className="menu__item">Trends</NavLink>
      </nav>

      {/* follow-us block (flex pushes it down) */}
      <div className="follow-us">
        <p className="follow-title">FOLLOW US</p>

        <a
          href="https://twitter.com/yourhandle"
          target="_blank"
          rel="noopener noreferrer"
          className="follow-link"
        >
          <IconX size={18} strokeWidth={2} />
          <span>X (Twitter)</span>
        </a>

        <a
          href="https://discord.gg/yourinvite"
          target="_blank"
          rel="noopener noreferrer"
          className="follow-link"
        >
          <Gamepad2 size={18} strokeWidth={2} />
          <span>Discord</span>
        </a>

        <a
          href="https://yoursite.com"
          target="_blank"
          rel="noopener noreferrer"
          className="follow-link"
        >
          <Globe size={18} strokeWidth={2} />
          <span>Website</span>
        </a>
      </div>
    </aside>
  );
}
