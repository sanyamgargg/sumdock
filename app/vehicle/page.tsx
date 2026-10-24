import { loadStates } from "@/lib/data";
import { publishability } from "@/lib/calc";

export default function Home() {
  const states = loadStates();
  return (
    <>
      <h1>Vehicle sales tax, title and registration costs by state</h1>
      <p className="lede">
        Pick your state to estimate what you will pay on top of the price. Every number links to the official page it came from.
      </p>
      <ul className="state-list">
        {states.map((s) => {
          const ok = publishability(s).publishable;
          return (
            <li key={s.slug}>
              <a href={`/vehicle/${s.slug}/`}>
                {s.name} {!ok && <span className="badge">in review</span>}
              </a>
            </li>
          );
        })}
      </ul>
    </>
  );
}
