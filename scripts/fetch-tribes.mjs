#!/usr/bin/env node
/**
 * Fetch all tribes from the EVE Frontier Utopia World API and write
 * a static JSON snapshot for frontend bundling.
 *
 * Usage:  node scripts/fetch-tribes.mjs
 * Output: src/data/tribes.json
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";

const API_BASE =
  "https://world-api-utopia.uat.pub.evefrontier.com/v2/tribes";
const LIMIT = 500;
const OUTPUT = "src/data/tribes.json";

async function fetchChunk(offset) {
  const url = `${API_BASE}?limit=${LIMIT}&offset=${offset}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
  return res.json();
}

async function main() {
  console.log("Fetching tribe catalog from World API…");

  const all = [];
  let offset = 0;

  for (;;) {
    const body = await fetchChunk(offset);
    const rows = body.data ?? body;
    if (!Array.isArray(rows) || rows.length === 0) break;

    for (const r of rows) {
      all.push({
        tribeId: r.id,
        name: r.name ?? "",
        nameShort: r.nameShort ?? "",
      });
    }

    console.log(`  offset ${offset}: ${rows.length} rows  (cumulative ${all.length})`);
    if (rows.length < LIMIT) break;
    offset += LIMIT;
  }

  // Sort by name for deterministic output
  all.sort((a, b) => a.name.localeCompare(b.name));

  const outPath = resolve(OUTPUT);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(all));

  console.log(`\n✓ ${all.length} tribes → ${OUTPUT}`);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
