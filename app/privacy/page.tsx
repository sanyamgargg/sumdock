import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `What data ${site.name} collects, how cookies and advertising work, and your choices.`,
};

export default function Privacy() {
  return (
    <>
      <h1>Privacy policy</h1>
      <p>Last updated {site.updated}.</p>

      <h2>What the calculator does with your inputs</h2>
      <p>
        The prices and other values you type into a calculator are processed in your browser. They are not sent to
        our server and are not stored.
      </p>

      <h2>Advertising and cookies</h2>
      <p>
        This site is intended to show ads served by Google AdSense. When ads are enabled, Google and its partners may
        use cookies or similar technologies to show ads based on your visits to this and other websites. Google&apos;s
        use of advertising cookies lets it and its partners serve ads to you based on your visit to this site and/or
        other sites on the internet.
      </p>
      <ul>
        <li>
          You can opt out of personalized advertising at{" "}
          <a href="https://adssettings.google.com" rel="noopener noreferrer" target="_blank">Google Ads Settings</a>.
        </li>
        <li>
          You can learn how Google uses information from sites that use its services at{" "}
          <a href="https://policies.google.com/technologies/partner-sites" rel="noopener noreferrer" target="_blank">policies.google.com/technologies/partner-sites</a>.
        </li>
        <li>
          Where required, a consent banner will let you accept or decline non-essential cookies before ads that use
          them are shown.
        </li>
      </ul>

      <h2>Analytics and server logs</h2>
      <p>
        The hosting provider may keep standard server logs (such as IP address, browser type and pages requested) for
        security and operations. If a traffic analytics tool is added, this page will be updated to name it.
      </p>

      <h2>Children</h2>
      <p>This site is not directed at children under 13 and does not knowingly collect their information.</p>

      <h2>Changes and contact</h2>
      <p>
        If this policy changes, the date above will change. Questions: see the <a href="/contact/">contact</a> page.
      </p>
    </>
  );
}
