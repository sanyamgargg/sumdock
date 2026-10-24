"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const NAV = [
  { href: "/vehicle/", label: "Vehicle costs" },
  { href: "/methodology/", label: "Methodology" },
  { href: "/changelog/", label: "Changelog" },
  { href: "/about/", label: "About" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const path = usePathname() ?? "";
  const button = useRef<HTMLButtonElement>(null);

  // Escape closes the phone menu and returns focus to its button.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="site-header">
      <div className="site-header__row">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <rect x="1" y="1" width="18" height="18" fill="none" stroke="#111111" strokeWidth="2" />
            <path d="M5 14h10M5 10h10" stroke="#111111" strokeWidth="2" fill="none" />
            <path d="M5 6h6" stroke="#B8320F" strokeWidth="2" fill="none" />
          </svg>
          sumdock
        </Link>
        <button
          ref={button}
          type="button"
          className="menu-btn"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path d={open ? "M4 4l12 12M16 4L4 16" : "M3 6h14M3 10h14M3 14h14"} stroke="currentColor" strokeWidth="2" fill="none" />
          </svg>
        </button>
        <nav id="site-nav" aria-label="Main" className={open ? "site-nav is-open" : "site-nav"}>
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              aria-current={path.startsWith(n.href) ? "page" : undefined}
            >
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
