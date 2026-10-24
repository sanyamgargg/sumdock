import type { MetadataRoute } from "next";
import { publishability } from "@/lib/calc";
import { loadStates } from "@/lib/data";
import { site } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string) => `${site.url}${p}`;
  const fixed = ["/", "/vehicle/", "/about/", "/methodology/", "/contact/", "/privacy/"];
  const states = loadStates()
    .filter((s) => publishability(s).publishable)
    .map((s) => ({ path: `/vehicle/${s.slug}/`, lastModified: s.lastReviewed }));
  return [
    ...fixed.map((p) => ({ url: u(p), lastModified: site.updated })),
    ...states.map((s) => ({ url: u(s.path), lastModified: s.lastModified })),
  ];
}
