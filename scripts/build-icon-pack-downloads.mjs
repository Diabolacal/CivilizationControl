import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const PUBLIC_DOWNLOADS_DIR = path.join(ROOT, "public", "downloads");
const SPEC_SOURCE = "docs/public/civilizationcontrol-icon-pack-spec.md";
const SPEC_DOWNLOAD = "public/downloads/civilizationcontrol-icon-pack-spec.md";
const ZIP_DOWNLOAD = "public/downloads/civilizationcontrol-icon-pack.zip";
const FIXED_DOS_TIME = 0;
const FIXED_DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1;

const CRC_TABLE = new Uint32Array(256);
for (let index = 0; index < CRC_TABLE.length; index += 1) {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
  }
  CRC_TABLE[index] = value >>> 0;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(value) {
  const buffer = Buffer.alloc(2);
  buffer.writeUInt16LE(value);
  return buffer;
}

function u32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value);
  return buffer;
}

async function collectSvgFiles() {
  const { readdir } = await import("node:fs/promises");
  const root = path.join(ROOT, "assets", "icons");
  const files = [];

  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const absolutePath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(absolutePath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(".svg")) {
        files.push(path.relative(ROOT, absolutePath).replaceAll(path.sep, "/"));
      }
    }
  }

  await walk(root);
  return files.sort((a, b) => a.localeCompare(b));
}

async function buildZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entryPath of entries) {
    const data = await readFile(path.join(ROOT, entryPath));
    const name = Buffer.from(entryPath, "utf8");
    const checksum = crc32(data);

    const localHeader = Buffer.concat([
      u32(0x04034b50),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(FIXED_DOS_TIME),
      u16(FIXED_DOS_DATE),
      u32(checksum),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
    ]);

    localParts.push(localHeader, data);

    centralParts.push(Buffer.concat([
      u32(0x02014b50),
      u16(20),
      u16(20),
      u16(0x0800),
      u16(0),
      u16(FIXED_DOS_TIME),
      u16(FIXED_DOS_DATE),
      u32(checksum),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(0),
      u32(offset),
      name,
    ]));

    offset += localHeader.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const endOfCentralDirectory = Buffer.concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(centralDirectory.length),
    u32(offset),
    u16(0),
  ]);

  return Buffer.concat([...localParts, centralDirectory, endOfCentralDirectory]);
}

await mkdir(PUBLIC_DOWNLOADS_DIR, { recursive: true });

const svgFiles = await collectSvgFiles();
const zipEntries = [...svgFiles, SPEC_SOURCE];
const spec = await readFile(path.join(ROOT, SPEC_SOURCE));
const zip = await buildZip(zipEntries);

await writeFile(path.join(ROOT, SPEC_DOWNLOAD), spec);
await writeFile(path.join(ROOT, ZIP_DOWNLOAD), zip);

console.log(JSON.stringify({
  markdown: SPEC_DOWNLOAD,
  zip: ZIP_DOWNLOAD,
  svgCount: svgFiles.length,
  zipEntries: zipEntries.length,
}, null, 2));
