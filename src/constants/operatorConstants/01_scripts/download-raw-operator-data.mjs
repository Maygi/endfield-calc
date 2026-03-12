import { access, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url); // current file path
const __dirname = path.dirname(__filename); // current directory

const BASE_URL =
  "https://endfieldtools.dev/localdb/optimized/characters/details";
const ROOT_DIR = path.join(__dirname, "..");
const LIST_FILE = path.join(__dirname, "raw-operator-list.md");
const OUTPUT_DIR = path.join(ROOT_DIR, "00_raws");
const FORCE = process.argv.includes("--force"); // if provided, overwrite existing files
const JSON_STRUCTURE_CHECK = process.argv.includes("--json-check"); // if provided, validate JSON structure
const MAX_DOWNLOADS = 30; // handle max items to download (current operators count in 1.0 is 23)
const MAX_BYTES_PER_FILE = 1024 * 1024; // handle max download size (1 MiB)
const REQUEST_TIMEOUT_MS = 10_000; // handle request timeout (10 seconds)

// handle only known-safe pattern url: chr_0000_name
const ID_PATTERN = /^chr_[0-9]{4}_[a-z0-9]+$/;

function isValidId(id) {
  return ID_PATTERN.test(id);
}

function parseListIds(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.split("<!--")[0].trim())
    .filter((line) => line.length > 0);
}

async function checkOutputFileAlreadyExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readResponse(response, id) {
  if (!response.body) {
    const text = await response.text();
    const bytes = Buffer.byteLength(text, "utf8");
    if (bytes > MAX_BYTES_PER_FILE) {
      // handle max download size (1 MiB)
      throw new Error(`Payload for ${id} exceeds ${MAX_BYTES_PER_FILE} bytes`);
    }
    return text;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_BYTES_PER_FILE) {
      try {
        await reader.cancel();
      } catch {
        // ignore cancel errors
      }
      throw new Error(`Payload for ${id} exceeds ${MAX_BYTES_PER_FILE} bytes`);
    }
    chunks.push(value);
  }

  const buffer = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder("utf-8").decode(buffer);
}

async function downloadOne(id) {
  const outPath = path.join(OUTPUT_DIR, `${id}.json`);
  if (!FORCE && (await checkOutputFileAlreadyExists(outPath))) {
    console.log(`skip ${id} (exists)`);
    return { ok: true, skipped: true };
  }

  const url = `${BASE_URL}/${id}.json`;

  const controller = new AbortController(); // handle request timeout
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, { signal: controller.signal });
  } catch (err) {
    clearTimeout(timeout);
    console.error(`fail  ${id} (request error: ${err.message})`);
    return { ok: false, skipped: false };
  }

  clearTimeout(timeout);

  if (!response.ok) {
    console.error(`fail  ${id} (${response.status})`);
    return { ok: false, skipped: false };
  }

  let text;
  try {
    text = await readResponse(response, id);
  } catch (err) {
    console.error(`fail  ${id} (${err.message})`);
    return { ok: false, skipped: false };
  }

  // handle malformed JSON shape before writing to disk
  if (JSON_STRUCTURE_CHECK) {
    try {
      JSON.parse(text);
    } catch (err) {
      console.error(`fail  ${id} (invalid JSON: ${err.message})`);
      return { ok: false, skipped: false };
    }
  }

  await writeFile(outPath, text, "utf8");
  console.log(`saved ${id}.json`);
  return { ok: true, skipped: false };
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });
  const listContent = await readFile(LIST_FILE, "utf8");
  const rawIds = parseListIds(listContent);

  if (!JSON_STRUCTURE_CHECK) {
    console.warn(
      `JSON structure will not be validated; run with --json-check to validate JSON structure`,
    );
  }
  const ids = [];
  for (const id of rawIds) {
    if (!isValidId(id)) {
      console.warn(`skip invalid id from list.md: "${id}"`);
      continue;
    }
    ids.push(id);
  }

  if (ids.length === 0) {
    console.log("No rows found in list.md, no ids to download");
    return;
  }

  const limitedIds = ids.slice(0, MAX_DOWNLOADS); // handle max items to download
  if (ids.length > MAX_DOWNLOADS) {
    console.log(
      `Limiting downloads to first ${MAX_DOWNLOADS} ids (of ${ids.length})`,
    );
  }

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const id of limitedIds) {
    try {
      const result = await downloadOne(id);
      if (result.skipped) skipped += 1;
      else if (result.ok) success += 1;
      else failed += 1;
    } catch (err) {
      console.error(`fail  ${id} (${err.message})`);
      failed += 1;
    }
  }

  console.log(`\nDone. saved=${success} skipped=${skipped} failed=${failed}`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exitCode = 1;
});
