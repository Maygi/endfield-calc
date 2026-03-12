import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url); // current file path
const __dirname = path.dirname(__filename); // current directory

const ROOT_DIR = path.join(__dirname, "..");
const RAW_SOURCE_DIR = path.join(ROOT_DIR, "00_raws"); // chr_*.json location
const JOLT_SPEC_ATTRIBUTES_PATH = path.join(
  __dirname,
  "jolt",
  "jolt-spec-attributes.json",
);
const OUTPUT_DIR = ROOT_DIR;
const TRANSFORM_ENDPOINT = "http://localhost:8099/api/transform";
const REQUEST_TIMEOUT_MS = 10_000;

// allow only lowercase alphanumeric characters in folder names
const ENG_NAME_CLEAN_PATTERN = /[^a-z0-9]+/g;

function normalizeEngName(name) {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(ENG_NAME_CLEAN_PATTERN, "");
}

const RAW_FILE_PATTERN = /^chr_[0-9]{4}_[a-z0-9]+\.json$/i;

async function listRawFiles() {
  const entries = await readdir(RAW_SOURCE_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && RAW_FILE_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .sort();
}

async function loadJson(filePath) {
  const text = await readFile(filePath, "utf8");
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON in ${filePath}: ${err.message}`);
  }
}

async function httpPostJoltTransformFunction(body) {
  const controller = new AbortController(); // handle request timeout
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(TRANSFORM_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    throw new Error(`transform request error: ${err.message}`);
  }

  clearTimeout(timeout);

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `transform HTTP ${response.status}: ${text || "no response body"}`,
    );
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`transform response not valid JSON: ${err.message}`);
  }
}

async function processOne(fileName, spec) {
  const rawPath = path.join(RAW_SOURCE_DIR, fileName);
  const raw = await loadJson(rawPath);

  const engName = raw.engName;
  const folderName = normalizeEngName(engName);
  if (!folderName) {
    console.warn(
      `skip ${fileName} (missing/wrong engName format: "${engName}")`,
    );
    return { ok: false, skipped: true };
  }

  const transformed = await httpPostJoltTransformFunction({
    input: raw,
    spec,
  });

  const outDir = path.join(OUTPUT_DIR, folderName);
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "attributes.json");
  await writeFile(outPath, JSON.stringify(transformed, null, 2), "utf8");

  console.log(`saved ${folderName}/attributes.json from ${fileName}`);
  return { ok: true, skipped: false };
}

async function main() {
  const files = await listRawFiles();
  if (files.length === 0) {
    console.log("No chr_*.json raw files found, nothing to transform.");
    return;
  }

  const spec = await loadJson(JOLT_SPEC_ATTRIBUTES_PATH);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const file of files) {
    try {
      const result = await processOne(file, spec);
      if (result.skipped) skipped += 1;
      else if (result.ok) success += 1;
      else failed += 1;
    } catch (err) {
      console.error(`fail  ${file} (${err.message})`);
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
