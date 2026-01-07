import {
  integer,
  jsonb,
  pgTable,
  real,
  serial,
  text,
  varchar,
} from "drizzle-orm/pg-core";

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  externalId: integer("external_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  nickname: varchar("nickname", { length: 255 }),
  nameJp: varchar("name_jp", { length: 255 }),
  image: text("image"),
  element: varchar("element", { length: 50 }),
  position: varchar("position", { length: 10 }),
  altPosition: varchar("alt_position", { length: 10 }),
  role: varchar("role", { length: 50 }),
  affinity: varchar("affinity", { length: 50 }),
  kick: integer("kick").default(0),
  control: integer("control").default(0),
  technique: integer("technique").default(0),
  pressure: integer("pressure").default(0),
  physical: integer("physical").default(0),
  agility: integer("agility").default(0),
  intelligence: integer("intelligence").default(0),
  total: integer("total").default(0),
  shotAT: real("shot_at"),
  focusAT: real("focus_at"),
  focusDF: real("focus_df"),
  scrambleAT: real("scramble_at"),
  scrambleDF: real("scramble_df"),
  wallsDF: real("walls_df"),
  kp: real("kp"),
  moves: jsonb("moves").$type<string[]>(),
  obtain: jsonb("obtain").$type<{
    playerUniverse?: string[];
    chronicleRoutes?: { route: string; chapters: string[] }[];
    freeMatch?: { game: string; teams: string[] }[];
  }>(),
});

export const heroes = pgTable("heroes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameJp: varchar("name_jp", { length: 255 }),
  image: text("image"),
  gender: varchar("gender", { length: 20 }),
  position: varchar("position", { length: 10 }),
  element: varchar("element", { length: 50 }),
  playstyle: varchar("playstyle", { length: 50 }),
  moveset: jsonb("moveset").$type<string[]>(),
  kick: integer("kick").default(0),
  control: integer("control").default(0),
  technique: integer("technique").default(0),
  pressure: integer("pressure").default(0),
  physical: integer("physical").default(0),
  agility: integer("agility").default(0),
  intelligence: integer("intelligence").default(0),
  total: integer("total").default(0),
});

export const fabled = pgTable("fabled", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameJp: varchar("name_jp", { length: 255 }),
  image: text("image"),
  gender: varchar("gender", { length: 20 }),
  position: varchar("position", { length: 10 }),
  altPosition: varchar("alt_position", { length: 10 }),
  element: varchar("element", { length: 50 }),
  moveset: jsonb("moveset").$type<string[]>(),
  altMoveset: jsonb("alt_moveset").$type<string[]>(),
  first3: jsonb("first3").$type<string[]>(),
  kick: integer("kick").default(0),
  control: integer("control").default(0),
  technique: integer("technique").default(0),
  pressure: integer("pressure").default(0),
  physical: integer("physical").default(0),
  agility: integer("agility").default(0),
  intelligence: integer("intelligence").default(0),
  total: integer("total").default(0),
});

export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameJp: varchar("name_jp", { length: 255 }),
  type: varchar("type", { length: 50 }),
  effect: text("effect"),
  shop: varchar("shop", { length: 100 }),
});

export const abilities = pgTable("abilities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameJp: varchar("name_jp", { length: 255 }),
  element: varchar("element", { length: 50 }),
  power: integer("power"),
  tp: integer("tp"),
  type: varchar("type", { length: 50 }),
  extra: varchar("extra", { length: 100 }),
  shop: varchar("shop", { length: 100 }),
});

export const tactics = pgTable("tactics", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameJp: varchar("name_jp", { length: 255 }),
  effect1: text("effect1"),
  effect2: text("effect2"),
  effect3: text("effect3"),
  shop: varchar("shop", { length: 100 }),
});

export const hyperMoves = pgTable("hyper_moves", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }),
  element: varchar("element", { length: 50 }),
  passive: text("passive"),
  hissatsuName: varchar("hissatsu_name", { length: 255 }),
  hissatsuType: varchar("hissatsu_type", { length: 50 }),
  power: integer("power"),
});

export const passives = pgTable("passives", {
  id: serial("id").primaryKey(),
  passiveId: varchar("passive_id", { length: 50 }).notNull(),
  number: integer("number"),
  type: varchar("type", { length: 50 }),
  description: text("description"),
  stat: varchar("stat", { length: 100 }),
  value: varchar("value", { length: 50 }),
});

export const matchDrops = pgTable("match_drops", {
  id: serial("id").primaryKey(),
  match: varchar("match", { length: 255 }).notNull(),
  game: varchar("game", { length: 50 }),
  drops: jsonb("drops").$type<{ id: number; type: string }[]>(),
});

export const kizunaItems = pgTable("kizuna_items", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  size: varchar("size", { length: 10 }),
  power: integer("power"),
  shop: varchar("shop", { length: 100 }),
  notes: text("notes"),
});
