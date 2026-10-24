import { site } from "@/lib/site";

export default function Home() {
  return (
    <>
      <h1>{site.name}</h1>
      <p className="lede">{site.tagline}</p>
      <ul className="state-list">
        <li>
          <a href="/vehicle/">
            <strong>Vehicle tax &amp; fee calculator</strong>
            <br />
            <small>Sales tax, title and registration fees by state.</small>
          </a>
        </li>
      </ul>
      <p>
        Each calculator shows the official page behind every figure and the date it was last checked. Read how this works
        on the <a href="/methodology/">methodology</a> page.
      </p>
    </>
  );
}
