import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `How to reach ${site.author}, the person who runs ${site.name}.`,
};

export default function Contact() {
  return (
    <>
      <h1>Contact</h1>
      <p>
        Questions, corrections and data updates are welcome. If you are reporting a wrong figure, please include the
        state, the item, and a link to the official page that shows the right amount. That lets me check and fix it quickly.
      </p>
      {site.contactEmail ? (
        <p>Email: <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a></p>
      ) : (
        <p className="banner">Contact address not set yet. Add it in <code>lib/site.ts</code> before publishing.</p>
      )}
      <p>
        I cannot give tax or legal advice, and I cannot look up your personal vehicle record. For those, contact your
        state revenue agency or motor vehicle office.
      </p>
    </>
  );
}
