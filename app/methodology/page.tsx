import type { Metadata } from "next";
import { publishability } from "@/lib/calc";
import { loadStates } from "@/lib/data";

export const metadata: Metadata = {
  title: "Methodology and Data Sources",
  description: "How vehicle tax and fee figures are collected, verified, tested and kept current.",
};

export default function Methodology() {
  const states = loadStates();
  return (
    <>
      <h1>Methodology</h1>
      <p>
        This page explains what counts as a verified number, how the calculator uses it, and when each state was last
        reviewed.
      </p>

      <h2>Where numbers come from</h2>
      <p>
        Figures are taken from state revenue and motor vehicle agency pages and forms. Each value is stored with the
        page address and the date it was opened. County agency pages and third-party sites are used only to fill a
        gap or cross-check, and are marked as such.
      </p>

      <h2>What the labels mean</h2>
      <ul>
        <li><strong>verified</strong>: confirmed on an official state agency page.</li>
        <li><strong>partial</strong>: an official source exists but something is missing or indirect (a county page, an older document, or a secondary confirmation). Shown with a &quot;check source&quot; tag.</li>
        <li><strong>conflict</strong>: official pages disagree. The amount is left out of totals until resolved.</li>
        <li><strong>unverified</strong>: no official source yet. Left out of totals.</li>
      </ul>

      <h2>How totals are calculated</h2>
      <ul>
        <li>Sales or use tax is computed on the price, less a trade-in allowance only where the state allows it.</li>
        <li>Local tax uses the rate you enter. Some states cap the amount it applies to (for example Florida&apos;s first $5,000).</li>
        <li>Fees are added only if verified or partial. Anything left out is listed under the result with the reason.</li>
        <li>The calculator code is covered by automated tests that compare results with worked examples and hand calculations.</li>
      </ul>

      <h2>How often it is checked</h2>
      <p>
        Pages are re-opened on a schedule: a changed-page check each month and a full re-verification each January and
        July, since many states adjust fees at the start of a year or fiscal year. A value older than 45 days is flagged
        before the site is rebuilt.
      </p>

      <h2>State review status</h2>
      <table>
        <tbody>
          {states.map((s) => (
            <tr key={s.slug}>
              <td><a href={`/vehicle/${s.slug}/`}>{s.name}</a></td>
              <td>Reviewed {s.lastReviewed}</td>
              <td>{publishability(s).publishable ? "Core figures confirmed" : "Still being verified"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Limits</h2>
      <p>
        Results are estimates. They do not include every local fee, special plate, lien or late penalty, and tax rules
        for leases, gifts and private sales vary. Always confirm with your state agency before you pay.
      </p>
    </>
  );
}
