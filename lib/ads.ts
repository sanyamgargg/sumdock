/**
 * AdSense settings, read at build time. Nothing ad-related is sent to the browser until the publisher ID is set.
 *
 * NEXT_PUBLIC_ADSENSE_CLIENT  The AdSense publisher ID, "ca-pub-" followed by 16 digits. Setting it adds the
 *                             AdSense script and site verification tag, fills /ads.txt and turns on the
 *                             privacy settings link. Set it when you apply to AdSense.
 * NEXT_PUBLIC_ADS_ENABLED=1   Reserve space in the ad slots. Set it once ad units are placed.
 */
const CLIENT_RE = /^ca-pub-\d{16}$/;

export function adsenseClient(raw = process.env.NEXT_PUBLIC_ADSENSE_CLIENT): string | null {
  const v = (raw ?? "").trim();
  return CLIENT_RE.test(v) ? v : null;
}

/** Google's certification authority ID for AdSense, the same for every publisher. */
const GOOGLE_TAG_ID = "f08c47fec0942fa0";

/** The /ads.txt body: one line naming Google as an authorised direct seller, or a comment until the ID is set. */
export function adsTxt(client = adsenseClient()): string {
  if (!client) return "# AdSense publisher ID not set yet. Set NEXT_PUBLIC_ADSENSE_CLIENT and rebuild.\n";
  return `google.com, ${client.replace(/^ca-/, "")}, DIRECT, ${GOOGLE_TAG_ID}\n`;
}

export const adsScriptSrc = (client: string) =>
  `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
