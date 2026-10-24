import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
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
        <a href="#main" className="skip">Skip to content</a>
        <SiteHeader name={site.name} />
        <main id="main" className="container page">{children}</main>
        <footer className="site-footer">
          <div className="container site-footer__inner">
            <nav aria-label="Footer" className="footnav">
              <Link href="/about/">About</Link>
              <Link href="/methodology/">Methodology</Link>
              <Link href="/contact/">Contact</Link>
              <Link href="/privacy/">Privacy</Link>
            </nav>
            <p>© {site.name}. Estimates only, not tax or legal advice.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
