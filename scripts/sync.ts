import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const SHEET_ID = "1N4h7z27Rxq3bvYuR9VyeQv3Ze-zwo-1XZQTd9rZa-Zs";
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
const ZUKAN_URL = "https://zukan.inazuma.jp";
const DATA_DIR = path.resolve(process.cwd(), "data");

function parseCSV(csv: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;
  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (char === '"') {
      if (inQuotes && csv[i + 1] === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && csv[i + 1] === "\n") i++;
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c)) rows.push(currentRow);
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c)) rows.push(currentRow);
  }
  return rows;
}

async function fetchSheet(sheetName: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  console.log(`  Fetching: ${sheetName}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${sheetName}: ${res.status}`);
  const csv = await res.text();
  return parseCSV(csv);
}

function toNumber(val: string | undefined): number {
  if (!val) return 0;
  const num = parseFloat(val.replace(/[^\d.-]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

function saveJSON(filename: string, data: unknown) {
  const filepath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(
    `  Saved: ${filename} (${Array.isArray(data) ? data.length : "object"} items)`,
  );
}

async function syncPlayersFromZukan() {
  console.log("\n[Players from zukan.inazuma.jp]");
  const players: Record<string, unknown>[] = [];
  let page = 1;
  while (true) {
    console.log(`  Fetching page ${page}...`);
    const url = `${ZUKAN_URL}/en/chara_param/?page=${page}&per_page=1000`;
    const res = await fetch(url);
    if (!res.ok) break;
    const html = await res.text();
    const $ = load(html);
    const items = $("ul.charaListBox > li");
    if (items.length === 0) break;
    items.each((_, node) => {
      const $p = $(node);
      const name = $p
        .find(".nameBox span.name")
        .first()
        .text()
        .replace(/\s+/g, " ")
        .trim();
      if (!name) return;
      const nickname = $p
        .find(".lBox .name span.nickname")
        .first()
        .text()
        .replace(/\s+/g, " ")
        .trim();
      const image = $p.find("figure img").attr("src") || "";
      const modelLink = $p.find("a").first().attr("href") || "";
      const game = $p.find("dl.appearedWorks dd").first().text().trim();
      const position = $p
        .find("ul.param > li")
        .first()
        .find("dl")
        .first()
        .find("dd")
        .text()
        .trim();
      const element = $p
        .find("ul.param > li")
        .first()
        .find("dl.box dd")
        .first()
        .text()
        .trim();
      const stats: Record<string, number> = {};
      const statKeys = [
        "Kick",
        "Control",
        "Technique",
        "Pressure",
        "Physical",
        "Agility",
        "Intelligence",
      ];
      $p.find("ul.param > li dl").each((_, dl) => {
        const label = $(dl).find("dt").text().trim();
        if (statKeys.includes(label)) {
          stats[label.toLowerCase()] = toNumber(
            $(dl).find("td").first().text(),
          );
        }
      });
      const basicInfo: Record<string, string> = {};
      $p.find("ul.basic li").each((_, li) => {
        const label = $(li).find("dt").text().trim();
        const value = $(li).find("dd").text().trim();
        if (label) basicInfo[label] = value;
      });
      players.push({
        id: players.length + 1,
        name,
        nickname,
        image,
        modelUrl: modelLink ? `${ZUKAN_URL}${modelLink}` : "",
        game,
        position,
        element,
        kick: stats.kick || 0,
        control: stats.control || 0,
        technique: stats.technique || 0,
        pressure: stats.pressure || 0,
        physical: stats.physical || 0,
        agility: stats.agility || 0,
        intelligence: stats.intelligence || 0,
        total: Object.values(stats).reduce((a, b) => a + b, 0),
        ageGroup: basicInfo["Age Group"] || "",
        year: basicInfo["School Year"] || "",
        gender: basicInfo.Gender || "",
        role: basicInfo["Character Role"] || "",
        affinity: "",
      });
    });
    if (items.length < 1000) break;
    page++;
  }
  console.log(`  Found ${players.length} players from zukan`);
  return players;
}

async function syncPlaystyleFromSheet(players: Record<string, unknown>[]) {
  console.log("\n[Playstyle from Google Sheet]");
  const rows = await fetchSheet("Characters");
  const headers = rows[0] || [];
  const nameLocalIdx = headers.findIndex(
    (h) => h.includes("Name(Localised)") || h === "Name(Localised)",
  );
  const nameRomaIdx = headers.findIndex(
    (h) => h.includes("Name(Romaji)") || h === "Name(Romaji)",
  );
  const kanjiIdx = headers.findIndex(
    (h) => h.includes("Name(漢字)") || h === "名前（漢字）",
  );
  const posIdx = headers.indexOf("Position");
  const altPosIdx = headers.findIndex(
    (h) => h.includes("Alt") && h.includes("Position"),
  );
  const playstyleIdx = headers.findIndex(
    (h) => h.includes("Playstyle") || h.includes("playstyle"),
  );
  const movesIdx = headers.findIndex(
    (h) => h.includes("Moves Learnt") || h.includes("First 3"),
  );
  console.log(
    `  Columns: localised=${nameLocalIdx}, romaji=${nameRomaIdx}, pos=${posIdx}, altPos=${altPosIdx}, playstyle=${playstyleIdx}, moves=${movesIdx}`,
  );
  const characterDataMap = new Map<
    string,
    {
      playstyle: string;
      altPosition: string;
      moves: string[];
    }
  >();
  const jpNamesMap = new Map<string, { roma: string; kanji: string }>();
  for (const r of rows.slice(1)) {
    const romaji = nameRomaIdx >= 0 ? r[nameRomaIdx] || "" : "";
    const localised = nameLocalIdx >= 0 ? r[nameLocalIdx] || "" : "";
    const kanji = kanjiIdx >= 0 ? r[kanjiIdx] || "" : "";
    const altPosition = altPosIdx >= 0 ? r[altPosIdx] || "" : "";
    const playstyle = playstyleIdx >= 0 ? r[playstyleIdx] || "" : "";
    const movesRaw = movesIdx >= 0 ? r[movesIdx] || "" : "";
    const moves = movesRaw
      .split(/\n|,/)
      .map((m: string) => m.trim())
      .filter(Boolean)
      .slice(0, 3);
    const cleanAltPos = altPosition
      .replace(/[^\w]/g, "")
      .substring(0, 2)
      .toUpperCase();
    const data = { playstyle, altPosition: cleanAltPos, moves };
    if (localised) {
      characterDataMap.set(localised.toLowerCase(), data);
      jpNamesMap.set(localised.toLowerCase(), { roma: romaji, kanji });
    }
    if (romaji) {
      characterDataMap.set(romaji.toLowerCase(), data);
    }
  }
  console.log("\n[AT/DF Stats from Google Sheet]");
  const atdfRows = await fetchSheet("Characters AT/DF");
  const atdfMap = new Map<
    string,
    {
      shotAT: number;
      focusAT: number;
      focusDF: number;
      scrambleAT: number;
      scrambleDF: number;
      wallsDF: number;
      kp: number;
    }
  >();
  for (const r of atdfRows.slice(1)) {
    const localised = r[5] || "";
    if (!localised) continue;
    atdfMap.set(localised.toLowerCase(), {
      shotAT: toNumber(r[16]),
      focusAT: toNumber(r[17]),
      focusDF: toNumber(r[18]),
      scrambleAT: toNumber(r[19]),
      scrambleDF: toNumber(r[20]),
      wallsDF: toNumber(r[21]),
      kp: toNumber(r[22]),
    });
  }
  let matched = 0;
  let atdfMatched = 0;
  for (const p of players) {
    const name = (p.name as string).toLowerCase();
    const nick = ((p.nickname as string) || "").toLowerCase();
    const data = characterDataMap.get(name) || characterDataMap.get(nick);
    if (data) {
      p.affinity = data.playstyle;
      p.altPosition = data.altPosition;
      p.moves = data.moves;
      matched++;
    }
    const atdf = atdfMap.get(name) || atdfMap.get(nick);
    if (atdf) {
      p.shotAT = atdf.shotAT;
      p.focusAT = atdf.focusAT;
      p.focusDF = atdf.focusDF;
      p.scrambleAT = atdf.scrambleAT;
      p.scrambleDF = atdf.scrambleDF;
      p.wallsDF = atdf.wallsDF;
      p.kp = atdf.kp;
      atdfMatched++;
    }
  }
  console.log(
    `  Matched character data for ${matched}/${players.length} players`,
  );
  console.log(
    `  Matched AT/DF stats for ${atdfMatched}/${players.length} players`,
  );
  const jpNames = Array.from(jpNamesMap.entries()).map(
    ([dub, { roma, kanji }]) => ({
      dub_name: dub,
      roma_name: roma,
      jp_name: kanji,
    }),
  );
  saveJSON("jp_names.json", jpNames);
  return players;
}

async function syncEquipment() {
  console.log("\n[Equipment]");
  const types = [
    { sheet: "Boots", type: "Boots" },
    { sheet: "Bracelet", type: "Bracelets" },
    { sheet: "Pendant", type: "Pendants" },
    { sheet: "Misc", type: "Misc" },
  ];
  const allEquipment: Record<string, unknown>[] = [];
  for (const { sheet, type } of types) {
    try {
      const rows = await fetchSheet(sheet);
      const items = rows
        .slice(1)
        .filter((r) => r[0])
        .map((r, i) => {
          const kick = toNumber(r[1]);
          const control = toNumber(r[2]);
          const technique = toNumber(r[3]);
          const pressure = toNumber(r[4]);
          const physical = toNumber(r[5]);
          const intelligence = toNumber(r[6]);
          const agility = toNumber(r[7]);
          return {
            id: `${type.charAt(0)}${i + 1}`,
            name: r[0],
            type,
            shop: r[8] || "",
            kick,
            control,
            technique,
            pressure,
            physical,
            intelligence,
            agility,
            total:
              kick +
              control +
              technique +
              pressure +
              physical +
              intelligence +
              agility,
          };
        });
      allEquipment.push(...items);
      console.log(`  ${type}: ${items.length} items`);
    } catch (e) {
      console.log(`  ${type}: Failed - ${e}`);
    }
  }
  saveJSON("equipment.json", allEquipment);
}

async function syncHissatsu() {
  console.log("\n[Hissatsu]");
  const rows = await fetchSheet("Hissatsu");
  const abilities = rows
    .slice(1)
    .filter((r) => r[1])
    .map((r) => ({
      name: r[1] || "",
      nameJp: r[2] || "",
      element: r[3] || "",
      power: toNumber(r[4]),
      tp: toNumber(r[5]),
      type: r[6] || "",
      extra: r[7] || "",
      shop: r[8] || r[9] || "",
    }));
  saveJSON("abilities.json", abilities);
}

async function syncPassives() {
  console.log("\n[Passives]");
  const allPassives: Record<string, unknown>[] = [];
  try {
    const customRows = await fetchSheet("Custom Passive");
    const custom = customRows
      .slice(1)
      .filter((r) => r[0])
      .map((r) => ({
        id: `custom-${r[0]}`,
        number: toNumber(r[0]),
        type: "custom",
        description: `${r[1]} - ${r[2]} ${r[3]}`,
        stat: r[2] || "",
        value: r[3] || "",
      }));
    allPassives.push(...custom);
    console.log(`  custom: ${custom.length}`);
  } catch (_e) {
    console.log(`  custom: Failed`);
  }
  try {
    const playerRows = await fetchSheet("Player Passive");
    const player = playerRows
      .slice(1)
      .filter((r) => r[0])
      .map((r) => ({
        id: `player-${r[0]}`,
        number: toNumber(r[0]),
        type: "player",
        description: `${r[1] || ""} - ${r[2] || ""} ${r[3] || ""}`.trim(),
        stat: r[2] || "",
        value: r[3] || "",
      }));
    allPassives.push(...player);
    console.log(`  player: ${player.length}`);
  } catch (_e) {
    console.log(`  player: Failed`);
  }
  try {
    const coordRows = await fetchSheet("Coordinator/Managers");
    const headers = coordRows[0];
    const passiveNoIdx = headers.findIndex((h) => h.includes("Passive No"));
    const reqIdx = headers.indexOf("Requirements");
    const statIdx = headers.indexOf("Stat");
    const buffIdx = headers.indexOf("Buff");
    const seen = new Set<string>();
    const coord = coordRows
      .slice(1)
      .filter((r) => r[passiveNoIdx])
      .map((r) => {
        const num = r[passiveNoIdx];
        if (seen.has(num)) return null;
        seen.add(num);
        return {
          id: `coordinator-${num}`,
          number: toNumber(num),
          type: "coordinator",
          description:
            `${r[reqIdx] || ""} - ${r[statIdx] || ""} ${r[buffIdx] || ""}`.trim(),
          stat: r[statIdx] || "",
          value: r[buffIdx] || "",
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    allPassives.push(...coord);
    console.log(`  coordinator: ${coord.length}`);
  } catch (_e) {
    console.log(`  coordinator: Failed`);
  }
  saveJSON("passives.json", allPassives);
}

async function syncTactics() {
  console.log("\n[Tactics]");
  const rows = await fetchSheet("Tactics");
  const tactics = rows
    .slice(1)
    .filter((r) => r[0])
    .map((r, i) => ({
      id: i + 1,
      name: r[0] || "",
      effect1: r[1] || "",
      effect2: r[2] || "",
      effect3: r[3] || "",
      duration: toNumber(r[4]),
      cooldown: toNumber(r[5]),
      shop: r[6] || "",
    }));
  saveJSON("tactics.json", tactics);
}

async function fetchByGid(gid: string): Promise<string[][]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  console.log(`  Fetching by GID: ${gid}`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch GID ${gid}: ${res.status}`);
  const csv = await res.text();
  return parseCSV(csv);
}

async function syncHyperMoves() {
  console.log("\n[Hyper Moves]");
  const rows = await fetchByGid("1289054828");
  const hyperMoves = rows
    .slice(2)
    .filter((r) => r[0] && r[0] !== "Name")
    .map((r, i) => ({
      id: i + 1,
      name: r[0] || "",
      type: r[1] || "",
      element: r[2] || "",
      passive: r[3] || "",
      hissatsuName: r[4] || "",
      hissatsuType: r[5] || "",
      power: toNumber(r[6]),
    }));
  saveJSON("hyper-moves.json", hyperMoves);
}

async function syncMatchDrops() {
  console.log("\n[Match Drops]");
  const rows = await fetchSheet("Free Match Drops");
  const matchMap = new Map<
    string,
    { match: string; game: string; drops: { id: number; type: string }[] }
  >();
  let currentTeam = "";
  let currentGame = "";
  for (const r of rows.slice(1)) {
    const teamCell = r[1] || "";
    const gameCell = r[2] || "";
    const passiveType = (r[4] || "custom").toLowerCase();
    const num = toNumber(r[5]);
    if (teamCell && !teamCell.includes("Beans") && !teamCell.includes("=")) {
      currentTeam = teamCell.replace(/\s*\d+$/, "").trim();
    }
    if (
      gameCell &&
      (gameCell.startsWith("IE") || gameCell.includes("Inazuma"))
    ) {
      currentGame = gameCell;
    }
    if (!currentTeam || !num) continue;
    const key = `${currentGame}-${currentTeam}`;
    if (!matchMap.has(key)) {
      matchMap.set(key, { match: currentTeam, game: currentGame, drops: [] });
    }
    const entry = matchMap.get(key);
    if (
      entry &&
      !entry.drops.find((d) => d.id === num && d.type === passiveType)
    ) {
      entry.drops.push({ id: num, type: passiveType });
    }
  }
  const matches = Array.from(matchMap.values()).filter(
    (m) => m.drops.length > 0,
  );
  saveJSON("match-drops.json", matches);
}

async function syncKizunaItems() {
  console.log("\n[Kizuna Town Items]");
  const rows = await fetchSheet("Kizuna Town Items");
  const items = rows
    .slice(1)
    .filter((r) => r[0])
    .map((r, i) => ({
      id: i + 1,
      name: r[0] || "",
      size: r[1] || "",
      power: toNumber(r[2]),
      shop: r[3] || "",
      notes: r[4] || "",
    }));
  saveJSON("kizuna-items.json", items);
}

async function fetchCharacterImageUrls(): Promise<{
  byId: Map<string, string>;
  byName: Map<string, string>;
}> {
  const byId = new Map<string, string>();
  const byName = new Map<string, string>();
  if (!API_KEY) {
    console.log("  No API key, skipping image URL fetch");
    return { byId, byName };
  }
  console.log("\n[Character Images via API]");
  try {
    const range = "Characters!A:F";
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}&valueRenderOption=FORMULA`;
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`  API error: ${res.status}`);
      return { byId, byName };
    }
    const data = await res.json();
    const rows = data.values || [];
    for (const row of rows.slice(1)) {
      const id = row[0] || "";
      const formula = row[1] || "";
      const romaji = row[4] || "";
      const localised = row[5] || "";
      const match = formula.match(/IMAGE\s*\(\s*"([^"]+)"/);
      if (match && !match[1].includes("secret")) {
        byId.set(id, match[1]);
        if (localised && !byName.has(localised.toLowerCase()))
          byName.set(localised.toLowerCase(), match[1]);
        if (romaji && !byName.has(romaji.toLowerCase()))
          byName.set(romaji.toLowerCase(), match[1]);
      }
    }
    console.log(`  Found ${byId.size} images by ID, ${byName.size} by name`);
  } catch (e) {
    console.log(`  API fetch failed: ${e}`);
  }
  return { byId, byName };
}

function cleanElement(el: string): string {
  if (el.includes("Fire") || el.includes("火")) return "Fire";
  if (el.includes("Wind") || el.includes("風")) return "Wind";
  if (el.includes("Forest") || el.includes("林")) return "Forest";
  if (el.includes("Mountain") || el.includes("山")) return "Mountain";
  if (el.includes("Void") || el.includes("虚")) return "Void";
  return el;
}

function cleanPosition(pos: string): string {
  if (!pos) return "";
  const p = pos.toUpperCase();
  if (p.includes("GK")) return "GK";
  if (p.includes("DF")) return "DF";
  if (p.includes("MF")) return "MF";
  if (p.includes("FW")) return "FW";
  return pos.substring(0, 2).toUpperCase();
}

async function syncHeroList(
  charImages: { byId: Map<string, string>; byName: Map<string, string> },
  playerImages: Map<string, string>,
) {
  console.log("\n[Hero List]");
  const rows = await fetchSheet("Hero");
  const seen = new Set<string>();
  const heroes = rows
    .slice(1)
    .filter((r) => r[3] && r[3] !== "#N/A")
    .filter((r) => {
      const name = r[3];
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    })
    .map((r, i) => {
      const inagleId = r[0] || "";
      const name = r[3] || "";
      const nameJp = r[2] || "";
      const moveset = (r[8] || "")
        .split(/\n/)
        .map((m: string) => m.trim())
        .filter(Boolean);
      const image =
        charImages.byId.get(inagleId) ||
        charImages.byName.get(name.toLowerCase()) ||
        charImages.byName.get(nameJp.toLowerCase()) ||
        playerImages.get(name.toLowerCase()) ||
        "";
      return {
        id: i + 1,
        name,
        nameJp,
        image,
        gender: r[4]?.includes("Male") ? "Male" : "Female",
        position: cleanPosition(r[5]),
        element: cleanElement(r[6]),
        playstyle: r[7] || "",
        moveset,
        kick: toNumber(r[9]),
        control: toNumber(r[10]),
        technique: toNumber(r[11]),
        pressure: toNumber(r[12]),
        physical: toNumber(r[13]),
        agility: toNumber(r[14]),
        intelligence: toNumber(r[15]),
        total:
          toNumber(r[9]) +
          toNumber(r[10]) +
          toNumber(r[11]) +
          toNumber(r[12]) +
          toNumber(r[13]) +
          toNumber(r[14]) +
          toNumber(r[15]),
      };
    });
  saveJSON("heroes.json", heroes);
}

async function syncFabledList(
  charImages: { byId: Map<string, string>; byName: Map<string, string> },
  playerImages: Map<string, string>,
) {
  console.log("\n[Fabled List]");
  const rows = await fetchSheet("Basara");
  const grouped: { main: string[]; passives: string[] }[] = [];
  for (const r of rows.slice(1)) {
    if (r[3] && r[3] !== "#N/A") {
      grouped.push({ main: r, passives: [] });
    } else if (grouped.length > 0 && r[10]) {
      grouped[grouped.length - 1].passives.push(r[10]);
    }
  }
  const fabled = grouped.map((g, i) => {
    const r = g.main;
    const inagleId = r[0] || "";
    const name = r[3] || "";
    const nameJp = r[2] || "";
    const moveset = (r[8] || "")
      .split(/\n/)
      .map((m: string) => m.trim())
      .filter(Boolean);
    const altMoveset = (r[9] || "")
      .split(/\n/)
      .map((m: string) => m.trim())
      .filter(Boolean);
    const mainPassive = (r[10] || "")
      .split(/\n/)
      .map((m: string) => m.trim())
      .filter(Boolean);
    const first3 = [...mainPassive, ...g.passives];
    const image =
      charImages.byId.get(inagleId) ||
      charImages.byName.get(name.toLowerCase()) ||
      charImages.byName.get(nameJp.toLowerCase()) ||
      playerImages.get(name.toLowerCase()) ||
      "";
    return {
      id: i + 1,
      name,
      nameJp,
      image,
      gender: r[4]?.includes("Male") ? "Male" : "Female",
      position: cleanPosition(r[5]),
      altPosition: cleanPosition(r[6]),
      element: cleanElement(r[7]),
      moveset,
      altMoveset,
      first3,
      kick: toNumber(r[11]),
      control: toNumber(r[12]),
      technique: toNumber(r[13]),
      pressure: toNumber(r[14]),
      physical: toNumber(r[15]),
      agility: toNumber(r[16]),
      intelligence: toNumber(r[17]),
      total:
        toNumber(r[11]) +
        toNumber(r[12]) +
        toNumber(r[13]) +
        toNumber(r[14]) +
        toNumber(r[15]) +
        toNumber(r[16]) +
        toNumber(r[17]),
    };
  });
  saveJSON("fabled.json", fabled);
}

async function main() {
  console.log("=== MixiMax Data Sync ===");
  console.log("Players: zukan.inazuma.jp");
  console.log("Other data: Inazuma Eleven VR Document (Google Sheet)");
  if (API_KEY) console.log("Google Sheets API: Enabled");
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  let players = await syncPlayersFromZukan();
  players = await syncPlaystyleFromSheet(players);
  const filteredPlayers = players.filter(
    (p) => p.name && p.name !== "???" && (p.total as number) > 0,
  );
  saveJSON("players.json", filteredPlayers);
  const playerImages = new Map<string, string>();
  for (const p of filteredPlayers) {
    if (p.image)
      playerImages.set((p.name as string).toLowerCase(), p.image as string);
  }
  const charImages = await fetchCharacterImageUrls();
  await syncEquipment();
  await syncHissatsu();
  await syncTactics();
  await syncHyperMoves();
  await syncPassives();
  await syncMatchDrops();
  await syncKizunaItems();
  await syncHeroList(charImages, playerImages);
  await syncFabledList(charImages, playerImages);
  console.log("\n=== Sync Complete ===");
}

main().catch(console.error);
