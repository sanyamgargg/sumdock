import { loadStates } from "@/lib/data";
import { llmsTxt } from "@/lib/seo";

export const dynamic = "force-static";

export function GET() {
  return new Response(llmsTxt(loadStates()), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
