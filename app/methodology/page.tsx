import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { publishability } from "@/lib/calc";
import { loadStates } from "@/lib/data";
import { llcPublishability } from "@/lib/llc-calc";
import { loadLlcStates } from "@/lib/llc-data";

export const metadata: Metadata = pageMetadata("/methodology/", "Methodology and Data Sources", "How vehicle tax and fee figures are collected, verified, tested and kept current.");

export default function Methodology() {
  const states = loadStates();
  const llcStates = loadLlcStates();
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
        page address and the date it was opened. Where a state publishes a figure only on a county agency page, that
        page is used and marked as a county source. Private and third-party websites are never the source of a
        number in a total.
      </p>

      <h2>What the labels mean</h2>
      <ul>
        <li><strong>verified</strong>: confirmed on an official state agency page.</li>
        <li><strong>partial</strong>: an official source exists but something is missing or indirect (a county page, an older document, or a secondary confirmation). Shown with a &quot;check source&quot; tag, and a state with such figures is labeled &quot;Sourced, check details&quot;.</li>
        <li><strong>conflict</strong>: official pages disagree. The amount is left out of totals until resolved.</li>
        <li><strong>unverified</strong>: no official source yet. Left out of totals and shown as &quot;Not included&quot;.</li>
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

      <h2 id="llc">LLC cost estimates</h2>
      <p>
        The LLC calculator uses the same labels and rules as the vehicle calculator. Its figures come from each state&apos;s own
        agencies: the Secretary of State or Division of Corporations for filing fees and reports, the revenue or tax agency
        for franchise or annual taxes, and the state&apos;s statutes where they set a fee. Law firms, formation services and
        blogs are never used as a source.
      </p>
      <ul>
        <li>The estimate covers the state fee to form a domestic LLC, plus the yearly or every-second-year fees to keep it active, over 1 to 5 years.</li>
        <li>A fee due every second year is counted only when it falls in the chosen period. A fee first due after the formation year is counted from the year it is first due.</li>
        <li>A page is public only when the formation filing fee and the main yearly fee are confirmed. Otherwise it is not indexed and the missing figure is listed as not included.</li>
        <li>Left out: a registered agent if you hire one, name reservation, expedited filing, certified copies, local business licenses, newspaper publication costs where a state requires them, card fees, and federal and state income taxes. Taxes that depend on income, such as a franchise tax above a threshold, are listed but not priced.</li>
        <li>This is not legal or tax advice.</li>
      </ul>
      <table>
        <tbody>
          {llcStates.map((s) => (
            <tr key={s.slug}>
              <td><a href={`/llc/${s.slug}/`}>{s.name} LLC</a></td>
              <td>Reviewed {s.lastReviewed}</td>
              <td>{llcPublishability(s).publishable ? "Core figures confirmed" : "Still being verified"}</td>
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
