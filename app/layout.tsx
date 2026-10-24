import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}: calculators with sourced numbers`, template: `%s | ${site.name}` },
  description: site.tagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" className={inter.variable}>
      <body>
        <header className="site">
          <a href="/" className="brand">{site.name}</a>
        </header>
        <main className="container page">{children}</main>
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
