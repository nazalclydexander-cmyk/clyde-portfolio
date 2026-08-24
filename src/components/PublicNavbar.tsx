"use client";

import { useState } from "react";
import { CloseIcon, GithubIcon, MenuIcon } from "@/components/Icons";

const links = [
  { href: "#about", label: "About" },
  { href: "#skills", label: "Skills" },
  { href: "#projects", label: "Projects" },
  { href: "#contact", label: "Contact" },
];

export default function PublicNavbar({ displayName, githubUrl }: { displayName: string; githubUrl?: string }) {
  const [open, setOpen] = useState(false);
  const brandInitial = displayName.trim().charAt(0).toUpperCase() || "C";

  return (
    <header className="site-header">
      <div className="site-container nav-inner">
        <a href="#top" className="brand-mark" aria-label={`${displayName} home`}>
          <span className="brand-symbol">{brandInitial}</span>
          <span>{displayName}</span>
        </a>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
        </nav>

        <div className="nav-actions">
          {githubUrl && (
            <div className="nav-action-group desktop-only">
              <a className="icon-button nav-github-button" href={githubUrl} target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub">
                <GithubIcon className="icon-md" />
              </a>
              <a className="button button-small nav-contact-button" href="#contact">Get in touch</a>
            </div>
          )}
          {!githubUrl && (
            <a className="button button-small nav-contact-button desktop-only" href="#contact">Get in touch</a>
          )}
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
