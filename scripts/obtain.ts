import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import type { Element } from "domhandler";

const DATA_DIR = path.resolve(process.cwd(), "data");
const ZUKAN_URL = "https://zukan.inazuma.jp";
type ObtainData = {
  playerUniverse?: string[];
  chronicleRoutes?: { route: string; chapters: string[] }[];
  freeMatch?: { game: string; teams: string[] }[];
};
type Player = {
  id: number;
  name: string;
  nameJp?: string;
  obtain?: ObtainData;
  [key: string]: unknown;
};
async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function parseObtainFromElement(
  $: ReturnType<typeof load>,
  $el: ReturnType<ReturnType<typeof load>>,
): ObtainData | null {
  const obtain: ObtainData = {};
  const $questionDd = $el.find("dd.question").first();
  if ($questionDd.length === 0) return null;
  $questionDd.find("> dl").each((_: number, dl: Element) => {
    const $dl = $(dl);
    const category = $dl.find("> dt").first().text().trim();
    if (category.toLowerCase().includes("universe")) {
      const items: string[] = [];
      $dl.find("dd ul li").each((_: number, li: Element) => {
        const text = $(li).text().trim();
        if (text) items.push(text);
      });
      if (items.length > 0) obtain.playerUniverse = items;
    } else if (
      category.toLowerCase().includes("chronicle") ||
      category.toLowerCase().includes("competition")
    ) {
      const routes: { route: string; chapters: string[] }[] = [];
      $dl.find("> dd").each((_: number, dd: Element) => {
        const $dd = $(dd);
        const routeName = $dd.find("> p").first().text().trim();
        const chapters: string[] = [];
        $dd.find("ul li").each((_: number, li: Element) => {
          const text = $(li).text().trim();
          if (text) chapters.push(text);
        });
        if (routeName && chapters.length > 0) {
          routes.push({ route: routeName, chapters });
        }
      });
      if (routes.length > 0) obtain.chronicleRoutes = routes;
    } else if (
      category.toLowerCase().includes("free") ||
      category.toLowerCase().includes("match")
    ) {
      const matches: { game: string; teams: string[] }[] = [];
      $dl.find("> dd").each((_: number, dd: Element) => {
        const $dd = $(dd);
        const gameName = $dd.find("> p").first().text().trim();
        const teams: string[] = [];
        $dd.find("ul li").each((_: number, li: Element) => {
          const text = $(li).text().trim();
          if (text) teams.push(text);
        });
        if (gameName && teams.length > 0) {
          matches.push({ game: gameName, teams });
        }
      });
      if (matches.length > 0) obtain.freeMatch = matches;
    }
  });
  const hasData =
    obtain.playerUniverse || obtain.chronicleRoutes || obtain.freeMatch;
  return hasData ? obtain : null;
}
async function main() {
  console.log("=== Sync How to Obtain Data ===");
  const playersPath = path.join(DATA_DIR, "players.json");
  const players: Player[] = JSON.parse(fs.readFileSync(playersPath, "utf-8"));
  const playersByName = new Map<string, Player>();
  for (const p of players) {
    playersByName.set(p.name.toLowerCase(), p);
    if (p.nickname) playersByName.set((p.nickname as string).toLowerCase(), p);
    if (p.nameJp) playersByName.set((p.nameJp as string).toLowerCase(), p);
  }
  const alreadyHaveObtain = players.filter((p) => p.obtain).length;
  console.log(`Total players: ${players.length}`);
  console.log(`Already have obtain data: ${alreadyHaveObtain}`);
  let totalFound = 0;
  let totalProcessed = 0;
  const languages = [
    { code: "en", dtText: "How to Obtain" },
    { code: "ja", dtText: "入手方法" },
  ];
  for (const lang of languages) {
    console.log(`\n=== Scraping ${lang.code.toUpperCase()} version ===`);
    let page = 1;
    while (true) {
      console.log(`\nPage ${page}...`);
      const url = `${ZUKAN_URL}/${lang.code}/chara_param/?page=${page}&per_page=100`;
      const res = await fetch(url);
      if (!res.ok) {
        console.log(`  Failed to fetch page ${page}: ${res.status}`);
        break;
      }
      const html = await res.text();
      const $ = load(html);
      const items = $("ul.charaListBox > li");
      if (items.length === 0) {
        console.log("  No more items, done!");
        break;
      }
      let pageFound = 0;
      items.each((_: number, node: Element) => {
        const $item = $(node);
        const name = $item
          .find(".nameBox span.name")
          .first()
          .text()
          .replace(/\s+/g, " ")
          .trim();
        if (!name) return;
        const player = playersByName.get(name.toLowerCase());
        if (!player) return;
        if (player.obtain) return;
        const $howToObtain = $item
          .find("dl")
          .filter((_: number, dl: Element) => {
            return $(dl).find("> dt").first().text().trim() === lang.dtText;
          })
          .first();
        if ($howToObtain.length > 0) {
          const obtain = parseObtainFromElement($, $howToObtain);
          if (obtain) {
            player.obtain = obtain;
            pageFound++;
            totalFound++;
          }
        }
        totalProcessed++;
      });
      console.log(
        `  Processed: ${items.length} items, Found: ${pageFound} new obtain data`,
      );
      fs.writeFileSync(playersPath, JSON.stringify(players, null, 2));
      if (items.length < 100) break;
      page++;
      await sleep(200);
    }
  }
  console.log(`\n=== Complete ===`);
  console.log(`Total processed: ${totalProcessed}`);
  console.log(`Total new obtain data found: ${totalFound}`);
  console.log(
    `Total players with obtain: ${players.filter((p) => p.obtain).length}`,
  );
}
main().catch(console.error);
