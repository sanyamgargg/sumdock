import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { adsScriptSrc, adsenseClient } from "@/lib/ads";
import { openGraph } from "@/lib/seo";
import { site } from "@/lib/site";

const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--font-plex-sans" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], display: "swap", variable: "--font-plex-mono" });

const adClient = adsenseClient();

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}: calculators with sourced numbers`, template: `%s | ${site.name}` },
  description: site.tagline,
  openGraph: openGraph("/", `${site.name}: calculators with sourced numbers`, site.tagline),
  twitter: { card: "summary", title: site.name, description: site.tagline },
  // AdSense site verification. Only present once the publisher ID is set.
  ...(adClient ? { other: { "google-adsense-account": adClient } } : {}),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US" className={`${plexSans.variable} ${plexMono.variable}`}>
      {adClient && (
        <head>
          {/* AdSense: also serves Google's consent message for visitors in the EEA, UK and Switzerland. */}
          <script async src={adsScriptSrc(adClient)} crossOrigin="anonymous" />
        </head>
      )}
      <body>
        <a href="#main" className="skip">Skip to content</a>
        <SiteHeader />
        <main id="main" className="page">{children}</main>
        <SiteFooter name={site.name} privacyChoices={!!adClient} />
      </body>
    </html>
  );
}
