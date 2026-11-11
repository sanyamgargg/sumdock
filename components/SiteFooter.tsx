import Link from "next/link";
import PrivacyChoices from "@/components/PrivacyChoices";

export default function SiteFooter({ name, privacyChoices = false }: { name: string; privacyChoices?: boolean }) {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <nav aria-label="Footer" className="footnav">
          <Link href="/methodology/">Methodology</Link>
          <Link href="/contact/">Contact</Link>
          <Link href="/privacy/">Privacy</Link>
          {privacyChoices && <PrivacyChoices />}
        </nav>
        <p>{name}. Estimates only, not tax or legal advice.</p>
      </div>
    </footer>
  );
}
