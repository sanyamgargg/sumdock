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

export type ChangelogTool = "vehicle" | "llc";

export interface ChangelogEntry {
  date: string;
  /** Which calculator the change belongs to. Entries written before the LLC tool have none and count as vehicle. */
  tool: ChangelogTool;
  state: string;
  stateName: string;
  summary: string;
}

/** Changes to state numbers and rules, newest first, as written in data/changelog.json. */
export function loadChangelog(): ChangelogEntry[] {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "changelog.json"), "utf8")) as {
    entries: (Omit<ChangelogEntry, "tool"> & { tool?: ChangelogTool })[];
  };
  return raw.entries.map((e) => ({ ...e, tool: e.tool ?? "vehicle" }));
}

export function loadState(slug: string): StateData | undefined {
  return loadStates().find((s) => s.slug === slug);
}
