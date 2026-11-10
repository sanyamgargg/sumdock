import type { MetadataRoute } from "next";
import { publishability } from "@/lib/calc";
import { loadStates } from "@/lib/data";
import { llcPublishability } from "@/lib/llc-calc";
import { loadLlcStates } from "@/lib/llc-data";
import { site } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string) => `${site.url}${p}`;
  const fixed = ["/", "/vehicle/", "/llc/", "/about/", "/methodology/", "/changelog/", "/contact/", "/privacy/"];
  const states = loadStates()
    .filter((s) => publishability(s).publishable)
    .map((s) => ({ path: `/vehicle/${s.slug}/`, lastModified: s.lastReviewed }));
  const llc = loadLlcStates()
    .filter((s) => llcPublishability(s).publishable)
    .map((s) => ({ path: `/llc/${s.slug}/`, lastModified: s.lastReviewed }));
  return [
    ...fixed.map((p) => ({ url: u(p), lastModified: site.updated })),
    ...states.map((s) => ({ url: u(s.path), lastModified: s.lastModified })),
    ...llc.map((s) => ({ url: u(s.path), lastModified: s.lastModified })),
  ];
}
