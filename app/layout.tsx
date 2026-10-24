import type { Metadata } from "next";
import "./globals.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}: calculators with sourced numbers`, template: `%s | ${site.name}` },
  description: site.tagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <body>
        <header className="site">
          <a href="/" className="brand">{site.name}</a>
        </header>
        <main>{children}</main>
        <footer className="site">
          <nav className="footnav">
            <a href="/about/">About</a> · <a href="/methodology/">Methodology</a> · <a href="/contact/">Contact</a> ·{" "}
            <a href="/privacy/">Privacy</a>
          </nav>
          <p>
            Estimates only, not tax or legal advice. Figures come from the official pages linked on each state page and can
            change. Confirm with your state agency before you pay.
          </p>
        </footer>
      </body>
    </html>
  );
}
