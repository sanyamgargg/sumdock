"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/vehicle/", label: "Vehicle calculator" },
  { href: "/methodology/", label: "Methodology" },
  { href: "/about/", label: "About" },
];

export default function SiteHeader({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const path = usePathname() ?? "";
  return (
    <header className="site-header">
      <div className="container site-header__row">
        <Link href="/" className="brand" onClick={() => setOpen(false)}>
          <svg width="24" height="24" viewBox="0 0 26 26" aria-hidden="true">
            <rect x="1" y="1" width="24" height="24" rx="6" fill="currentColor" className="brand__mark" />
            <path d="M7 14.5h12M7 10h12M7 19h7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" fill="none" />
          </svg>
          {name}
        </Link>
        <button
          type="button"
          className="menu-btn"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path d={open ? "M4 4l12 12M16 4L4 16" : "M3 6h14M3 10h14M3 14h14"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
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
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
