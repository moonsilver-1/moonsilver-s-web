#!/usr/bin/env node
import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";

const ALGO = "aes-256-gcm";
const IV_LEN = 16;
const TAG_LEN = 16;
const EXTENSIONS = new Set([".md", ".markdown", ".txt"]);
const IGNORED = new Set(["README.md"]);

function getKey() {
  if (process.env.CONTENT_SECRET) return process.env.CONTENT_SECRET;
  try {
    const content = readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of content.split("\n")) {
      const match = line.match(/^CONTENT_SECRET=(.+)/);
      if (match) return match[1].trim().replace(/^["']|["']$/g, "");
    }
  } catch {}
  return null;
}

function encrypt(plain, key) {
  const keyBuf = Buffer.from(key, "hex");
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, keyBuf, iv);
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]);
}

function decrypt(buf, key) {
  const keyBuf = Buffer.from(key, "hex");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const data = buf.subarray(IV_LEN + TAG_LEN);
  const dec = createDecipheriv(ALGO, keyBuf, iv);
  dec.setAuthTag(tag);
  return Buffer.concat([dec.update(data), dec.final()]).toString("utf8");
}

async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(fullPath);
    else if (entry.isFile()) yield fullPath;
  }
}

async function encryptAll() {
  const key = getKey();
  if (!key) {
    console.error("Set CONTENT_SECRET in .env.local or as env var");
    process.exit(1);
  }

  const contentDir = path.join(process.cwd(), "content");
  let count = 0;
  for await (const filePath of walk(contentDir)) {
    const ext = path.extname(filePath).toLowerCase();
    const base = path.basename(filePath);
    if (!EXTENSIONS.has(ext) || IGNORED.has(base)) continue;

    const plain = await readFile(filePath);
    const encrypted = encrypt(plain, key);
    await writeFile(filePath + ".enc", encrypted);
    console.log(`encrypted: ${path.relative(process.cwd(), filePath)}.enc`);
    count++;
  }
  console.log(`Done. ${count} files encrypted.`);
}

async function decryptAll() {
  const key = getKey();
  if (!key) {
    console.error("Set CONTENT_SECRET in .env.local or as env var");
    process.exit(1);
  }

  const contentDir = path.join(process.cwd(), "content");
  let count = 0;
  for await (const filePath of walk(contentDir)) {
    if (!filePath.endsWith(".enc")) continue;

    const enc = await readFile(filePath);
    const plain = decrypt(enc, key);
    const outPath = filePath.slice(0, -4);
    await writeFile(outPath, plain);
    console.log(`decrypted: ${path.relative(process.cwd(), outPath)}`);
    count++;
  }
  console.log(`Done. ${count} files decrypted.`);
}

function genKey() {
  const key = randomBytes(32).toString("hex");
  console.log(`CONTENT_SECRET=${key}`);
  console.log("\n1. Add this to .env.local");
  console.log("2. Add this to Vercel Settings > Environment Variables");
  console.log("3. Run: node scripts/content-crypto.mjs encrypt");
}

const cmd = process.argv[2];
if (cmd === "genkey") genKey();
else if (cmd === "encrypt") await encryptAll();
else if (cmd === "decrypt") await decryptAll();
else {
  console.log("Usage: node scripts/content-crypto.mjs <genkey|encrypt|decrypt>");
  process.exit(1);
}
