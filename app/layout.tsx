import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { site } from "@/lib/site";

const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap", variable: "--font-plex-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}: calculators with sourced numbers`, template: `%s | ${site.name}` },
  description: site.tagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <a href="#main" className="skip">Skip to content</a>
        <SiteHeader />
        <main id="main" className="page">{children}</main>
        <SiteFooter name={site.name} />
      </body>
    </html>
  );
}
