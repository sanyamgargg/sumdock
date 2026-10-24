/**
 * Empty placeholder for a future ad unit. No ad code yet.
 * The reserved height keeps the layout from jumping when an ad is added later.
 * When AdSense is approved, render the ad unit inside this div and keep the height.
 */
export default function AdSlot({ name, minHeight = 280 }: { name: string; minHeight?: number }) {
  return (
    <aside
      className="ad-slot"
      data-ad-slot={name}
      aria-hidden="true"
      style={{ minHeight }}
    >
      {/* AD SLOT: {name}. Intentionally empty. */}
    </aside>
  );
}
