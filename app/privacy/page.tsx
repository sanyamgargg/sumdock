import type { Metadata } from "next";
import { adsenseClient } from "@/lib/ads";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = pageMetadata("/privacy/", "Privacy Policy", `What data ${site.name} collects, how cookies and advertising work, and your choices.`);

const ext = { rel: "noopener noreferrer", target: "_blank" } as const;

export default function Privacy() {
  const adsLive = !!adsenseClient();
  return (
    <>
      <h1>Privacy policy</h1>
      <p>Last updated {site.updated}.</p>

      <h2>Who runs this site</h2>
      <p>
        {site.name} ({site.url.replace("https://", "")}) is run by {site.author}. Questions about this policy can go to the
        address on the <a href="/contact/">contact</a> page.
      </p>

      <h2>What the calculators do with your inputs</h2>
      <p>
        The prices and other values you type into a calculator are worked out in your browser. They are not sent to our
        server and we do not store them. If you use the &ldquo;copy link&rdquo; feature, your inputs are written into the
        page address so the link reopens the same estimate. Anyone you share that link with can see those inputs.
      </p>
      <p>The site itself does not set cookies or use browser storage.</p>

      <h2>Advertising</h2>
      {adsLive ? (
        <p>This site shows ads served by Google AdSense.</p>
      ) : (
        <p>
          This site does not show ads yet. It plans to use Google AdSense, and this section describes how that will work
          once ads are turned on.
        </p>
      )}
      <ul>
        <li>
          Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s prior visits to this
          website or other websites.
        </li>
        <li>
          Google&apos;s use of advertising cookies enables it and its partners to serve ads to you based on your visit to
          this site and/or other sites on the internet.
        </li>
        <li>
          You may opt out of personalized advertising by visiting{" "}
          <a href="https://adssettings.google.com" {...ext}>Google Ads Settings</a>. You can also opt out of some
          third-party vendors&apos; use of cookies for personalized advertising at{" "}
          <a href="https://www.aboutads.info/choices/" {...ext}>aboutads.info</a>.
        </li>
        <li>
          Google explains how it uses information from sites that use its services at{" "}
          <a href="https://policies.google.com/technologies/partner-sites" {...ext}>How Google uses information from sites or apps that use our services</a>.
        </li>
      </ul>

      <h2>Your consent choices</h2>
      <p>
        Visitors in the European Economic Area, the United Kingdom and Switzerland are asked for consent through
        Google&apos;s consent message before cookies are used for ads. You can choose to see non-personalized ads, which
        do not use your browsing history to pick ads.
      </p>
      <p>
        If you live in a US state with its own privacy law, such as California, you can opt out of the use of your
        information for targeted ads through Google&apos;s message where it is shown, or through Google Ads Settings.
      </p>
      {adsLive && (
        <p>
          To change a choice you made, use the &ldquo;Privacy and cookie choices&rdquo; link at the bottom of every page.
        </p>
      )}

      <h2>Hosting and server logs</h2>
      <p>
        The site is hosted on Cloudflare, which may keep standard request logs (such as IP address, browser type and
        pages requested) for security and operations. We do not use a traffic analytics tool. If one is added, this page
        will name it.
      </p>

      <h2>Children</h2>
      <p>This site is not directed at children under 13 and does not knowingly collect their information.</p>

      <h2>Changes</h2>
      <p>If this policy changes, the date at the top of this page will change.</p>
    </>
  );
}
