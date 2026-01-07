import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.resolve(process.cwd(), "data");
const BATCH_SIZE = 50;
const DELAY_MS = 100;
type Player = {
  id: number;
  name: string;
  modelUrl?: string;
  fullbodyBase?: string;
  [key: string]: unknown;
};
async function fetchFullbodyBase(modelUrl: string): Promise<string | null> {
  try {
    const res = await fetch(modelUrl);
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/\/1\/k\/([a-z])\/([a-z])\/([a-z0-9_-]+)`/i);
    if (match) {
      return `https://dxi4wb638ujep.cloudfront.net/1/k/${match[1]}/${match[2]}/${match[3]}`;
    }
    return null;
  } catch {
    return null;
  }
}
async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function main() {
  console.log("=== Sync Fullbody URLs ===");
  const playersPath = path.join(DATA_DIR, "players.json");
  const players: Player[] = JSON.parse(fs.readFileSync(playersPath, "utf-8"));
  const needsFullbody = players.filter((p) => p.modelUrl && !p.fullbodyBase);
  console.log(`Total players: ${players.length}`);
  console.log(
    `Already have fullbody: ${players.length - needsFullbody.length}`,
  );
  console.log(`Need to fetch: ${needsFullbody.length}`);
  if (needsFullbody.length === 0) {
    console.log("All players have fullbody URLs!");
    return;
  }
  let fetched = 0;
  let found = 0;
  for (let i = 0; i < needsFullbody.length; i += BATCH_SIZE) {
    const batch = needsFullbody.slice(i, i + BATCH_SIZE);
    console.log(
      `\nBatch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(needsFullbody.length / BATCH_SIZE)} (${i + 1}-${Math.min(i + BATCH_SIZE, needsFullbody.length)})`,
    );
    const results = await Promise.all(
      batch.map(async (player) => {
        if (!player.modelUrl) return null;
        const fullbodyBase = await fetchFullbodyBase(player.modelUrl);
        return { id: player.id, fullbodyBase };
      }),
    );
    for (const result of results) {
      if (result?.fullbodyBase) {
        const player = players.find((p) => p.id === result.id);
        if (player) {
          player.fullbodyBase = result.fullbodyBase;
          found++;
        }
      }
      fetched++;
    }
    console.log(
      `  Progress: ${fetched}/${needsFullbody.length} fetched, ${found} found`,
    );
    fs.writeFileSync(playersPath, JSON.stringify(players, null, 2));
    await sleep(DELAY_MS);
  }
  console.log(`\n=== Complete ===`);
  console.log(`Fetched: ${fetched}`);
  console.log(`Found fullbody URLs: ${found}`);
}
main().catch(console.error);
