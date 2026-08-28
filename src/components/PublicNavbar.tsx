"use client";

import { useState } from "react";
import { CloseIcon, GithubIcon, MenuIcon } from "@/components/Icons";

const links = [
  { href: "#about", label: "About" },
  { href: "#skills", label: "Capabilities" },
  { href: "#projects", label: "Work" },
  { href: "#contact", label: "Contact" },
];

export default function PublicNavbar({ displayName, githubUrl }: { displayName: string; githubUrl?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="site-container nav-inner">
        <a href="#top" className="brand-mark" aria-label={`${displayName} home`}>
          <span className="brand-wordmark">
            <strong>{displayName}</strong>
            <small>Cloud Engineer</small>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
        </nav>

        <div className="nav-actions">
          <div className="nav-action-group desktop-only">
            {githubUrl && <a className="nav-text-action" href={githubUrl} target="_blank" rel="noopener noreferrer"><GithubIcon className="icon-sm" />GitHub</a>}
            <a className="nav-text-action" href="#contact">Contact</a>
          </div>
          <button className="icon-button menu-button" type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="mobile-navigation" aria-label="Toggle navigation">
            {open ? <CloseIcon className="icon-md" /> : <MenuIcon className="icon-md" />}
          </button>
        </div>
      </div>

      {open && (
        <nav id="mobile-navigation" className="mobile-nav" aria-label="Mobile navigation">
          <div className="site-container">
            {links.map((link) => <a key={link.href} href={link.href} onClick={() => setOpen(false)}>{link.label}</a>)}
            {githubUrl && <a href={githubUrl} target="_blank" rel="noopener noreferrer">GitHub</a>}
          </div>
        </nav>
      )}
    </header>
  );
}
