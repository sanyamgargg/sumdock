/**
 * Empty placeholder for a future ad unit. No ad code yet.
 * The reserved height keeps the layout from jumping when an ad arrives, so it only applies once ads are on
 * (set NEXT_PUBLIC_ADS_ENABLED=1 at build time). Until then the slot takes no space and leaves no blank band.
 * When AdSense is approved, render the ad unit inside this div and keep the height.
 */
export default function AdSlot({ name, minHeight = 280 }: { name: string; minHeight?: number }) {
  const reserve = process.env.NEXT_PUBLIC_ADS_ENABLED === "1";
  return (
    <aside
      className={reserve ? "ad-slot ad-slot--reserved" : "ad-slot"}
      data-ad-slot={name}
      aria-hidden="true"
      style={reserve ? { minHeight } : undefined}
    >
      {/* AD SLOT: {name}. Intentionally empty. */}
    </aside>
  );
}
