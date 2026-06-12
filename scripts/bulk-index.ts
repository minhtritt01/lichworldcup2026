#!/usr/bin/env npx tsx

/**
 * Bulk submit URLs to Google Indexing API
 *
 * Usage:
 *   npx tsx scripts/bulk-index.ts                    # Submit all from sitemap
 *   npx tsx scripts/bulk-index.ts --limit 200        # Submit first 200 only
 *   npx tsx scripts/bulk-index.ts --dry-run          # Preview without submitting
 *   npx tsx scripts/bulk-index.ts --urls urls.txt    # Submit from file
 */

import { google } from "googleapis";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// ─── Config ─────────────────────────────────────────────

const SITE_URL = "https://lichworldcup2026.vn";
const SERVICE_ACCOUNT_PATH = join(__dirname, "service-account.json");
const DAILY_QUOTA = 200;
const BATCH_SIZE = 100; // eslint-disable-line @typescript-eslint/no-unused-vars
const LOG_FILE = join(__dirname, "indexing-log.json");

// ─── Collect all URLs from sitemap ──────────────────────

function getAllUrls(): string[] {
  const urls: string[] = [];

  urls.push(SITE_URL);
  urls.push(`${SITE_URL}/en`);

  urls.push(`${SITE_URL}/teams`);
  urls.push(`${SITE_URL}/en/teams`);

  urls.push(`${SITE_URL}/reports`);
  urls.push(`${SITE_URL}/en/reports`);

  // 104 matches × 2 locales = 208
  for (let i = 1; i <= 104; i++) {
    const id = `wc26_${String(i).padStart(3, "0")}`;
    urls.push(`${SITE_URL}/live/${id}`);
    urls.push(`${SITE_URL}/en/live/${id}`);
  }

  // 48 teams × 2 locales = 96
  const teamSlugs = [
    "mexico", "south-africa", "south-korea", "czechia", "canada", "bosnia",
    "qatar", "switzerland", "brazil", "morocco", "haiti", "scotland",
    "usa", "paraguay", "australia", "turkiye", "germany", "curacao",
    "ivory-coast", "ecuador", "netherlands", "japan", "sweden", "tunisia",
    "spain", "cape-verde", "saudi-arabia", "uruguay", "belgium", "egypt",
    "iran", "new-zealand", "france", "senegal", "iraq", "norway",
    "argentina", "algeria", "austria", "jordan", "portugal", "dr-congo",
    "uzbekistan", "colombia", "england", "croatia", "ghana", "panama",
  ];

  for (const slug of teamSlugs) {
    urls.push(`${SITE_URL}/teams/${slug}`);
    urls.push(`${SITE_URL}/en/teams/${slug}`);
  }

  return urls;
}

// ─── Load URLs from file ────────────────────────────────

function getUrlsFromFile(filePath: string): string[] {
  return readFileSync(filePath, "utf-8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && l.startsWith("http"));
}

// ─── Read previously submitted URLs ─────────────────────

interface IndexLog {
  lastRun: string;
  submitted: Record<string, { status: string; time: string }>;
}

function readLog(): IndexLog {
  if (existsSync(LOG_FILE)) {
    return JSON.parse(readFileSync(LOG_FILE, "utf-8"));
  }
  return { lastRun: "", submitted: {} };
}

function writeLog(log: IndexLog) {
  writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

// ─── Google Auth ────────────────────────────────────────

async function getAuthClient() {
  const credentials = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });

  return auth.getClient();
}

// ─── Submit single URL ──────────────────────────────────

async function submitUrl(
  auth: Awaited<ReturnType<typeof getAuthClient>>,
  url: string,
  type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED",
): Promise<{ url: string; status: string; error?: string }> {
  try {
    const res = await google.indexing("v3").urlNotifications.publish({
      auth,
      requestBody: { url, type },
    });
    return { url, status: `${res.status} OK` };
  } catch (err: unknown) {
    const error = err as {
      response?: { status: number; data: unknown };
      message?: string;
    };
    return {
      url,
      status: "ERROR",
      error: error.response
        ? `${error.response.status}: ${JSON.stringify(error.response.data)}`
        : (error.message ?? "Unknown error"),
    };
  }
}

// ─── Main ───────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const limitIdx = args.indexOf("--limit");
  const limit =
    limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : DAILY_QUOTA;
  const urlFileIdx = args.indexOf("--urls");
  const urlFile = urlFileIdx !== -1 ? args[urlFileIdx + 1] : null;

  console.log("");
  console.log("══════════════════════════════════════════════════");
  console.log("🔍 GOOGLE BULK INDEXING — lichworldcup2026.vn");
  console.log("══════════════════════════════════════════════════");
  console.log("");

  let allUrls: string[];
  if (urlFile) {
    allUrls = getUrlsFromFile(urlFile);
    console.log(`📄 Loaded ${allUrls.length} URLs from ${urlFile}`);
  } else {
    allUrls = getAllUrls();
    console.log(`🗺️  Generated ${allUrls.length} URLs from sitemap structure`);
  }

  const log = readLog();
  const today = new Date().toISOString().split("T")[0];
  const todaySubmitted = Object.entries(log.submitted)
    .filter(([, v]) => v.time.startsWith(today))
    .map(([k]) => k);

  const pending = allUrls.filter((u) => !todaySubmitted.includes(u));
  const batch = pending.slice(0, Math.min(limit, DAILY_QUOTA));

  console.log(`📊 Status:`);
  console.log(`   Total URLs:         ${allUrls.length}`);
  console.log(`   Already submitted:  ${todaySubmitted.length} (today)`);
  console.log(`   Pending:            ${pending.length}`);
  console.log(
    `   Will submit now:    ${batch.length} (quota: ${DAILY_QUOTA}/day)`,
  );
  console.log("");

  if (batch.length === 0) {
    console.log(
      "✅ All URLs already submitted today! Run again tomorrow for remaining.",
    );
    return;
  }

  if (isDryRun) {
    console.log("🏃 DRY RUN — would submit these URLs:");
    batch.forEach((u, i) => console.log(`   ${i + 1}. ${u}`));
    console.log("");
    console.log(`Run without --dry-run to actually submit.`);
    return;
  }

  console.log("🔐 Authenticating with Google...");
  const auth = await getAuthClient();
  console.log("✅ Authenticated");
  console.log("");

  let success = 0;
  let errors = 0;

  for (let i = 0; i < batch.length; i++) {
    const url = batch[i];
    const progress = `[${i + 1}/${batch.length}]`;

    const result = await submitUrl(auth, url);

    if (result.status.includes("OK")) {
      success++;
      console.log(`   ✅ ${progress} ${url}`);
      log.submitted[url] = { status: "OK", time: new Date().toISOString() };
    } else {
      errors++;
      console.log(`   ❌ ${progress} ${url} — ${result.error}`);
      log.submitted[url] = { status: "ERROR", time: new Date().toISOString() };
    }

    if (i < batch.length - 1) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  log.lastRun = new Date().toISOString();
  writeLog(log);

  const remaining = pending.length - batch.length;
  console.log("");
  console.log("══════════════════════════════════════════════════");
  console.log(`✅ Submitted: ${success} | ❌ Errors: ${errors}`);
  if (remaining > 0) {
    console.log(`⏳ Remaining: ${remaining} URLs — run again tomorrow`);
  } else {
    console.log(`🎉 All URLs submitted!`);
  }
  console.log(`📝 Log saved: ${LOG_FILE}`);
  console.log("══════════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
