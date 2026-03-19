#!/usr/bin/env node
/**
 * Fetch all item types from the EVE Frontier World API and write
 * a static JSON snapshot for frontend bundling.
 *
 * Usage:  node scripts/fetch-types.mjs
 * Output: src/data/itemTypes.json
 *
 * The dataset (~400 entries) is written in the shape expected by
 * the ItemType TypeScript interface so no runtime mapping is needed.
 *
 * To refresh: npm run generate:types
 */

import { writeFileSync, mkdirSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";

const API_BASE =
  "https://world-api-stillness.live.tech.evefrontier.com/v2/types";
const LIMIT = 500; // dataset is ~400 total — one page likely covers it, but paginate defensively
const OUTPUT = "src/data/itemTypes.json";

async function fetchChunk(offset) {
  const url = `${API_BASE}?limit=${LIMIT}&offset=${offset}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText} at offset ${offset}`);
  return res.json();
}

async function main() {
  console.log("Fetching item-type catalog from World API…");

  const all = [];
  let offset = 0;

  for (;;) {
    const body = await fetchChunk(offset);
    const rows = body.data ?? body;
    if (!Array.isArray(rows) || rows.length === 0) break;

    for (const r of rows) {
      // Defensive: skip rows without a valid numeric id
      const id = Number(r.id);
      if (!Number.isFinite(id) || id <= 0) continue;

      const name = typeof r.name === "string" ? r.name.trim() : "";
      if (!name) continue; // Unnamed types are unusable in UI

      all.push({
        typeId: id,
        name,
        description: typeof r.description === "string" ? r.description.trim() : "",
        mass: Number(r.mass) || 0,
        volume: Number(r.volume) || 0,
        portionSize: Number(r.portionSize) || 0,
        groupName: typeof r.groupName === "string" ? r.groupName.trim() : "",
        groupId: Number(r.groupId) || 0,
        categoryName: typeof r.categoryName === "string" ? r.categoryName.trim() : "",
        categoryId: Number(r.categoryId) || 0,
      });
    }

    console.log(`  offset ${offset}: ${rows.length} rows  (cumulative ${all.length})`);

    // Check metadata for total count if available
    const total = body.metadata?.total;
    if (typeof total === "number" && offset + rows.length >= total) break;
    if (rows.length < LIMIT) break;
    offset += LIMIT;
  }

  // Sort by name for deterministic output and UI-friendly ordering
  all.sort((a, b) => a.name.localeCompare(b.name));

  const outPath = resolve(OUTPUT);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(all));

  const sizeKB = (statSync(outPath).size / 1024).toFixed(1);
  console.log(`\n✓ ${all.length} item types → ${OUTPUT} (${sizeKB} KB)`);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
