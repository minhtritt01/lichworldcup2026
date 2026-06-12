#!/usr/bin/env npx tsx

/**
 * IndexNow — instant notify Bing, Yandex, Naver about all URLs
 *
 * Usage: npx tsx scripts/index-now.ts
 *
 * Before running:
 *   1. Replace INDEXNOW_KEY with your own random string (32+ chars recommended)
 *   2. The script will create public/<key>.txt automatically
 */

import { writeFileSync } from "fs";
import { join } from "path";

const SITE_URL = "https://lichworldcup2026.vn";
const INDEXNOW_KEY = "a1b2c3d4e5f6g7h8i9j0"; // CHANGE THIS before first run

async function main() {
  const urls: string[] = [];

  urls.push(SITE_URL, `${SITE_URL}/en`);
  urls.push(`${SITE_URL}/teams`, `${SITE_URL}/en/teams`);
  urls.push(`${SITE_URL}/reports`, `${SITE_URL}/en/reports`);

  for (let i = 1; i <= 104; i++) {
    const id = `wc26_${String(i).padStart(3, "0")}`;
    urls.push(`${SITE_URL}/live/${id}`, `${SITE_URL}/en/live/${id}`);
  }

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
    urls.push(`${SITE_URL}/teams/${slug}`, `${SITE_URL}/en/teams/${slug}`);
  }

  console.log(`📡 Submitting ${urls.length} URLs to IndexNow (Bing, Yandex)...`);

  // Write key file to public/ so IndexNow can verify site ownership
  const keyFilePath = join(process.cwd(), "public", `${INDEXNOW_KEY}.txt`);
  writeFileSync(keyFilePath, INDEXNOW_KEY);
  console.log(`   ✅ Key file created: public/${INDEXNOW_KEY}.txt`);

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      host: "lichworldcup2026.vn",
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
      urlList: urls,
    }),
  });

  console.log(`Response: ${res.status} ${res.statusText}`);

  if (res.ok) {
    console.log(`✅ All ${urls.length} URLs submitted to Bing + Yandex!`);
  } else {
    console.log(`❌ Error: ${await res.text()}`);
  }

  console.log("");
  console.log(`⚠️  Deploy the public/${INDEXNOW_KEY}.txt file so IndexNow can verify ownership.`);
}

main().catch(console.error);
