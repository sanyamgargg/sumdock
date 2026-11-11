"use client";

declare global {
  interface Window {
    googlefc?: { callbackQueue?: unknown[]; showRevocationMessage?: () => void };
  }
}

/**
 * Reopens Google's consent message (set up under Privacy & messaging in AdSense) so a visitor can change their
 * choice. Rendered only when the AdSense publisher ID is set.
 */
export default function PrivacyChoices() {
  const open = () => {
    const fc = (window.googlefc = window.googlefc || {});
    fc.callbackQueue = fc.callbackQueue || [];
    fc.callbackQueue.push(() => window.googlefc?.showRevocationMessage?.());
  };
  return (
    <button type="button" className="footnav__button" onClick={open}>
      Privacy and cookie choices
    </button>
  );
}
