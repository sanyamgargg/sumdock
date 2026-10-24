import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `Who runs ${site.name}, why it exists, and how its numbers are kept accurate.`,
};

export default function About() {
  return (
    <>
      <h1>About this site</h1>
      <p>
        {site.name} publishes calculators that show, for every figure, the official page it came from and the date it
        was last opened. The first one estimates the sales tax, title and registration fees you pay on top of a vehicle
        price, which vary by state.
      </p>

      <h2>Who runs it</h2>
      <p><strong>{site.author}</strong>, {site.authorRole.toLowerCase()}. {site.authorBio}</p>
      <p>
        I am not a tax professional or a lawyer. I read the published rules from state revenue and motor vehicle
        agencies, enter them as data, and test the calculator against them. When two official pages disagree or I cannot
        find an official source, the number is left out and the page says so.
      </p>

      <h2>How it stays accurate</h2>
      <ul>
        <li>Every value is stored with its source link and the date it was opened.</li>
        <li>The build fails if a value is missing a source, or if an &quot;official&quot; claim only has a secondary source.</li>
        <li>Pages whose core numbers are not confirmed are hidden from search engines and show a warning.</li>
        <li>Each state is re-checked on a schedule. See the <a href="/methodology/">methodology</a> page.</li>
      </ul>

      <h2>Found a mistake?</h2>
      <p>
        Please tell me, with a link to the official page showing the correct figure. See the <a href="/contact/">contact</a> page.
        Corrections are checked against the official source and fixed on the next update.
      </p>
    </>
  );
}
