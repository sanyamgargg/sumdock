import Link from "next/link";

export default function SiteFooter({ name }: { name: string }) {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <nav aria-label="Footer" className="footnav">
          <Link href="/methodology/">Methodology</Link>
          <Link href="/contact/">Contact</Link>
          <Link href="/privacy/">Privacy</Link>
        </nav>
        <p>{name}. Estimates only, not tax or legal advice.</p>
      </div>
    </footer>
  );
}
