import fs from "node:fs";
import path from "node:path";
import type { StateData } from "./types";

const dir = path.join(process.cwd(), "data", "states");

export function loadStates(): StateData[] {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as StateData)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function loadState(slug: string): StateData | undefined {
  return loadStates().find((s) => s.slug === slug);
}
