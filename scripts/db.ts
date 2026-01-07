import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../lib/db/schema";

const DATA_DIR = path.join(process.cwd(), "data");

function loadJSON<T>(filename: string): T[] {
  const filepath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filepath)) return [];
  return JSON.parse(fs.readFileSync(filepath, "utf-8"));
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  console.log("=== Push to Supabase ===");
  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(client, { schema });

  console.log("\n[players]");
  const players = loadJSON<Record<string, unknown>>("players.json");
  if (players.length > 0) {
    console.log("  Clearing table...");
    await db.delete(schema.players);
    console.log(`  Inserting ${players.length} rows...`);
    for (let i = 0; i < players.length; i += 100) {
      const batch = players.slice(i, i + 100).map((p) => ({
        externalId: p.id as number,
        name: p.name as string,
        nickname: p.nickname as string,
        nameJp: p.nameJp as string,
        image: p.image as string,
        element: p.element as string,
        position: p.position as string,
        altPosition: p.altPosition as string,
        role: p.role as string,
        affinity: p.affinity as string,
        kick: p.kick as number,
        control: p.control as number,
        technique: p.technique as number,
        pressure: p.pressure as number,
        physical: p.physical as number,
        agility: p.agility as number,
        intelligence: p.intelligence as number,
        total: p.total as number,
        shotAT: p.shotAT as number,
        focusAT: p.focusAT as number,
        focusDF: p.focusDF as number,
        scrambleAT: p.scrambleAT as number,
        scrambleDF: p.scrambleDF as number,
        wallsDF: p.wallsDF as number,
        kp: p.kp as number,
        moves: p.moves as string[],
        obtain: p.obtain as {
          playerUniverse?: string[];
          chronicleRoutes?: { route: string; chapters: string[] }[];
          freeMatch?: { game: string; teams: string[] }[];
        },
      }));
      await db.insert(schema.players).values(batch);
    }
    console.log(`  Done: ${players.length} rows`);
  }

  console.log("\n[heroes]");
  const heroes = loadJSON<Record<string, unknown>>("heroes.json");
  if (heroes.length > 0) {
    console.log("  Clearing table...");
    await db.delete(schema.heroes);
    console.log(`  Inserting ${heroes.length} rows...`);
    const batch = heroes.map((h) => ({
      name: h.name as string,
      nameJp: h.nameJp as string,
      image: h.image as string,
      gender: h.gender as string,
      position: h.position as string,
      element: h.element as string,
      playstyle: h.playstyle as string,
      moveset: h.moveset as string[],
      kick: h.kick as number,
      control: h.control as number,
      technique: h.technique as number,
      pressure: h.pressure as number,
      physical: h.physical as number,
      agility: h.agility as number,
      intelligence: h.intelligence as number,
      total: h.total as number,
    }));
    await db.insert(schema.heroes).values(batch);
    console.log(`  Done: ${heroes.length} rows`);
  }

  console.log("\n[fabled]");
  const fabled = loadJSON<Record<string, unknown>>("fabled.json");
  if (fabled.length > 0) {
    console.log("  Clearing table...");
    await db.delete(schema.fabled);
    console.log(`  Inserting ${fabled.length} rows...`);
    const batch = fabled.map((f) => ({
      name: f.name as string,
      nameJp: f.nameJp as string,
      image: f.image as string,
      gender: f.gender as string,
      position: f.position as string,
      altPosition: f.altPosition as string,
      element: f.element as string,
      moveset: f.moveset as string[],
      altMoveset: f.altMoveset as string[],
      first3: f.first3 as string[],
      kick: f.kick as number,
      control: f.control as number,
      technique: f.technique as number,
      pressure: f.pressure as number,
      physical: f.physical as number,
      agility: f.agility as number,
      intelligence: f.intelligence as number,
      total: f.total as number,
    }));
    await db.insert(schema.fabled).values(batch);
    console.log(`  Done: ${fabled.length} rows`);
  }

  console.log("\n[equipment]");
  const equipment = loadJSON<Record<string, unknown>>("equipment.json");
  if (equipment.length > 0) {
    console.log("  Clearing table...");
    await db.delete(schema.equipment);
    console.log(`  Inserting ${equipment.length} rows...`);
    const batch = equipment.map((e) => ({
      name: e.name as string,
      nameJp: e.nameJp as string,
      type: e.type as string,
      effect: e.effect as string,
      shop: e.shop as string,
    }));
    await db.insert(schema.equipment).values(batch);
    console.log(`  Done: ${equipment.length} rows`);
  }

  console.log("\n[abilities]");
  const abilities = loadJSON<Record<string, unknown>>("abilities.json");
  if (abilities.length > 0) {
    console.log("  Clearing table...");
    await db.delete(schema.abilities);
    console.log(`  Inserting ${abilities.length} rows...`);
    const batch = abilities.map((a) => ({
      name: a.name as string,
      nameJp: a.nameJp as string,
      element: a.element as string,
      power: a.power as number,
      tp: a.tp as number,
      type: a.type as string,
      extra: a.extra as string,
      shop: a.shop as string,
    }));
    await db.insert(schema.abilities).values(batch);
    console.log(`  Done: ${abilities.length} rows`);
  }

  console.log("\n[tactics]");
  const tactics = loadJSON<Record<string, unknown>>("tactics.json");
  if (tactics.length > 0) {
    console.log("  Clearing table...");
    await db.delete(schema.tactics);
    console.log(`  Inserting ${tactics.length} rows...`);
    const batch = tactics.map((t) => ({
      name: t.name as string,
      nameJp: t.nameJp as string,
      effect1: t.effect1 as string,
      effect2: t.effect2 as string,
      effect3: t.effect3 as string,
      shop: t.shop as string,
    }));
    await db.insert(schema.tactics).values(batch);
    console.log(`  Done: ${tactics.length} rows`);
  }

  console.log("\n[hyper_moves]");
  const hyperMoves = loadJSON<Record<string, unknown>>("hyper-moves.json");
  if (hyperMoves.length > 0) {
    console.log("  Clearing table...");
    await db.delete(schema.hyperMoves);
    console.log(`  Inserting ${hyperMoves.length} rows...`);
    const batch = hyperMoves.map((h) => ({
      name: h.name as string,
      type: h.type as string,
      element: h.element as string,
      passive: h.passive as string,
      hissatsuName: h.hissatsuName as string,
      hissatsuType: h.hissatsuType as string,
      power: h.power as number,
    }));
    await db.insert(schema.hyperMoves).values(batch);
    console.log(`  Done: ${hyperMoves.length} rows`);
  }

  console.log("\n[passives]");
  const passives = loadJSON<Record<string, unknown>>("passives.json");
  if (passives.length > 0) {
    console.log("  Clearing table...");
    await db.delete(schema.passives);
    console.log(`  Inserting ${passives.length} rows...`);
    const batch = passives.map((p) => ({
      passiveId: p.id as string,
      number: p.number as number,
      type: p.type as string,
      description: p.description as string,
      stat: p.stat as string,
      value: p.value as string,
    }));
    await db.insert(schema.passives).values(batch);
    console.log(`  Done: ${passives.length} rows`);
  }

  console.log("\n[match_drops]");
  const matchDrops = loadJSON<Record<string, unknown>>("match-drops.json");
  if (matchDrops.length > 0) {
    console.log("  Clearing table...");
    await db.delete(schema.matchDrops);
    console.log(`  Inserting ${matchDrops.length} rows...`);
    const batch = matchDrops.map((m) => ({
      match: m.match as string,
      game: m.game as string,
      drops: m.drops as { id: number; type: string }[],
    }));
    await db.insert(schema.matchDrops).values(batch);
    console.log(`  Done: ${matchDrops.length} rows`);
  }

  console.log("\n[kizuna_items]");
  const kizunaItems = loadJSON<Record<string, unknown>>("kizuna-items.json");
  if (kizunaItems.length > 0) {
    console.log("  Clearing table...");
    await db.delete(schema.kizunaItems);
    console.log(`  Inserting ${kizunaItems.length} rows...`);
    const batch = kizunaItems.map((k) => ({
      name: k.name as string,
      size: k.size as string,
      power: k.power as number,
      shop: k.shop as string,
      notes: k.notes as string,
    }));
    await db.insert(schema.kizunaItems).values(batch);
    console.log(`  Done: ${kizunaItems.length} rows`);
  }

  await client.end();
  console.log("\n=== Push Complete ===");
}

main().catch(console.error);
