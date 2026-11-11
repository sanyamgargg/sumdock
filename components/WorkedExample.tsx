import { countySpread, spreadValue, walkthrough } from "@/lib/examples";
import { usd, usdShort } from "@/lib/format";
import type { StateData } from "@/lib/types";

/**
 * A $30,000 purchase worked out step by step, and what the same purchase costs in the lowest, middle and highest
 * county. Every amount comes from calculate() through lib/examples.ts.
 */
export default function WorkedExample({ state }: { state: StateData }) {
  const w = walkthrough(state);
  const spread = countySpread(state);
  const title = w.inputs.tradeIn > 0
    ? `${usdShort(w.inputs.price)} vehicle, ${usdShort(w.inputs.tradeIn)} trade-in`
    : `${usdShort(w.inputs.price)} vehicle`;

  return (
    <div className="walk">
      <div className="walk__main">
        <h3 className="walk__title">Step by step: {title}</h3>
        <p className="muted">
          A new gas vehicle registered in {w.place ? w.place.name : state.name}
          {w.place ? `, the middle of ${state.name}'s ${spread?.kind === "fee" ? "county fees" : "local rates"}` : ""}.
        </p>
        <ol className="walk__steps">
          {w.steps.map((s) => (
            <li key={s.id} className={`walk__step walk__step--${s.kind}`}>
              <span className="walk__label">
                {s.label}
                {s.status === "partial" && <span className="line__flag">Check source</span>}
                {s.detail && <small className="walk__detail">{s.detail}</small>}
              </span>
              <b className="walk__amt">{s.amount === null ? "—" : usd(s.amount)}</b>
            </li>
          ))}
        </ol>
        <div className="walk__total">
          <span>Taxes and fees due</span>
          <b>{usd(w.result.total)}</b>
        </div>
        <p className="walk__note">
          {w.inputs.tradeIn > 0 ? "Price less the trade-in, plus taxes and fees: " : "Price plus taxes and fees: "}
          <b>{usd(w.inputs.price - w.inputs.tradeIn + w.result.total)}</b>.
        </p>
        {w.recurring.length > 0 && (
          <p className="walk__note">
            Paid again later: {w.recurring.map((r) => `${r.label}, every ${r.every}${r.byValue ? " (based on the vehicle\u2019s value, so it changes)" : ` (${usd(r.amount)} at today\u2019s rate)`}`).join("; ")}.
          </p>
        )}
        {w.result.excluded.length > 0 && (
          <p className="example__excl">Not included: {w.result.excluded.map((e) => e.label).join("; ")}.</p>
        )}
      </div>

      {spread && (
        <div className="walk__side">
          <h3 className="walk__title">Same purchase, different county</h3>
          <table className="spread">
            <thead>
              <tr>
                <th scope="col">County</th>
                <th scope="col" className="num">{spread.kind === "rate" ? "Local rate" : "County fee"}</th>
                <th scope="col" className="num">Total</th>
              </tr>
            </thead>
            <tbody>
              {spread.rows.map((r) => (
                <tr key={r.label}>
                  <td><span className="spread__rank">{r.label}</span>{r.place.name}</td>
                  <td className="num">{spreadValue(spread.kind, r.place.value)}</td>
                  <td className="num">{usd(r.result.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted">
            The gap between the lowest and highest county is{" "}
            <b>{usd(spread.rows[2].result.total - spread.rows[0].result.total)}</b> on this purchase. County-level rates only;
            some cities and districts add more. Choose your own county in the calculator above.
          </p>
        </div>
      )}
    </div>
  );
}
