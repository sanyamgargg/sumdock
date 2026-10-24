export const usd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });

/** Whole dollars when there are no cents, otherwise two decimals. Used in prose. */
export const usdShort = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: Number.isInteger(n) ? 0 : 2 });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10-24" becomes "Oct 24, 2026". Parsed by hand so the time zone cannot shift the day. */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  return `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}

/** Turns what someone typed ("30,000", "$1,250.5") into a non-negative number. Anything unreadable is 0. */
export function parseNumber(raw: string): number {
  const n = Number(raw.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

export function groupNumber(n: number, maxDecimals = 2): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: maxDecimals });
}
