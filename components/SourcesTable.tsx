import { formatDate } from "@/lib/format";
import { splitTitle, type Footnotes } from "@/lib/sources";

const TYPE_LABEL = { "state-agency": "State agency", "county-agency": "County agency", secondary: "Secondary source" } as const;

/** The sources behind the page. Row numbers match the [n] footnotes in the statement. */
export default function SourcesTable({ items }: { items: Footnotes["ordered"] }) {
  const dates = items.map((i) => i.source.accessed).sort();
  const secondary = items.filter((i) => i.source.publisherType === "secondary").length;
  const first = dates[0];
  const last = dates[dates.length - 1];
  const opened = !first ? "" : first === last ? `all opened ${formatDate(first)}` : `opened ${formatDate(first)} to ${formatDate(last)}`;
  const meta = [
    `${items.length} ${secondary > 0 ? "pages" : "official pages"}`,
    secondary > 0 ? `${secondary} secondary` : null,
    opened || null,
  ].filter(Boolean).join(", ");

  return (
    <section id="sources" className="sources" aria-labelledby="sources-title">
      <div className="section-head">
        <h2 id="sources-title">Sources</h2>
        <p className="section-head__meta">{meta}</p>
      </div>
      <div className="sources__scroll" tabIndex={0} role="region" aria-label="Sources table, scrolls sideways on narrow screens">
        <ol className="sources__list">
          {items.map(({ source, usedFor }, i) => {
            const n = i + 1;
            const { publisher, page } = splitTitle(source.title);
            return (
              <li key={source.url} id={`s${n}`} className="src">
                <span className="src__num">[{n}]</span>
                <div className="src__what">
                  {page}
                  <span className="src__supports">Supports: {usedFor.join(", ")}</span>
                </div>
                <div className="src__meta">
                  <span className="src__pub">
                    {publisher ?? TYPE_LABEL[source.publisherType]}
                    {source.publisherType !== "state-agency" && publisher && <small>{TYPE_LABEL[source.publisherType]}</small>}
                  </span>
                  <a className="src__open" href={source.url} target="_blank" rel="noopener noreferrer" aria-label={`Open page: ${source.title} (opens in a new tab)`}>
                    Open page
                  </a>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
