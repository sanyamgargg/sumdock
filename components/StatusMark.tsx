import type { Verification } from "@/lib/content";

/**
 * Small square glyph plus the status word. The word is always shown, so the mark never relies on colour alone.
 * Verified: solid ink square. Partly verified: square with a 2px accent border. In review: dashed gray square.
 */
export default function StatusMark({ status, label }: { status: Verification; label: string }) {
  return (
    <span className="mark">
      <span className={`mark__glyph mark__glyph--${status}`} aria-hidden="true" />
      {label}
    </span>
  );
}
