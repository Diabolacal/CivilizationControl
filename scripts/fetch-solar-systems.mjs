#!/usr/bin/env node
/**
 * Fetch all solar systems from the EVE Frontier World API and write
 * a static JSON snapshot for frontend bundling.
 *
 * Usage:  node scripts/fetch-solar-systems.mjs
 * Output: src/data/solarSystems.json
 *
 * The dataset (~24.5k entries) is written in the shape expected by
 * the SolarSystem TypeScript interface so no runtime mapping is needed.
 */

import { writeFileSync, mkdirSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";

const API_BASE =
  "https://world-api-stillness.live.tech.evefrontier.com/v2/solarsystems";
const LIMIT = 1000;
const OUTPUT = "src/data/solarSystems.json";

async function fetchChunk(offset) {
  const url = `${API_BASE}?limit=${LIMIT}&offset=${offset}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText}`);
  return res.json();
}

async function main() {
  console.log("Fetching solar-system catalog from World API…");

  const all = [];
  let offset = 0;

  for (;;) {
    const body = await fetchChunk(offset);
    const rows = body.data ?? body;
    if (!Array.isArray(rows) || rows.length === 0) break;

    for (const r of rows) {
      // API fields: id, name, constellationId, regionId, location.{x,y,z}
      const name = r.name ?? r.solarSystemName ?? "";
      if (!name) continue; // skip unnamed systems — unusable in autocomplete
      all.push({
        solarSystemId: r.id ?? r.solarSystemId,
        solarSystemName: name,
        constellationId: r.constellationId ?? 0,
        regionId: r.regionId ?? 0,
        location: {
          x: r.location?.x ?? 0,
          y: r.location?.y ?? 0,
          z: r.location?.z ?? 0,
        },
      });
    }

    console.log(`  offset ${offset}: ${rows.length} rows  (cumulative ${all.length})`);
    if (rows.length < LIMIT) break;
    offset += LIMIT;
  }

  // Sort by name for deterministic output
  all.sort((a, b) => a.solarSystemName.localeCompare(b.solarSystemName));

  const outPath = resolve(OUTPUT);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(all));

  const sizeMB = (statSync(outPath).size / 1024 / 1024).toFixed(2);
  console.log(`\n✓ ${all.length} systems → ${OUTPUT} (${sizeMB} MB)`);
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
