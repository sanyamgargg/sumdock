import fs from "node:fs";
import path from "node:path";
import type { LlcState } from "./llc-types";

const dir = path.join(process.cwd(), "data", "llc");

export function loadLlcStates(): LlcState[] {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as LlcState)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function loadLlcState(slug: string): LlcState | undefined {
  return loadLlcStates().find((s) => s.slug === slug);
}
