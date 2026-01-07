"use client";
import { Hash, RotateCcw, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import matchDropsData from "@/data/match-drops.json";
import passivesData from "@/data/passives.json";

type MatchDrop = { id: number; type: string };
type MatchRecord = { match: string; game: string; drops: MatchDrop[] };
type Passive = {
  id: string;
  number: number;
  type: string;
  description: string;
  stat: string;
  value: string;
};

const matchesData = matchDropsData as MatchRecord[];
const passives = passivesData as Passive[];
const passivesById = new Map(passives.map((p) => [p.id, p]));

const GAMES = [...new Set(matchesData.map((m) => m.game))].sort();
const DROP_TYPES = [
  "all",
  "custom",
  "manager",
  "coordinator",
  "player",
] as const;

const TYPE_COLORS: Record<string, string> = {
  custom: "#f59e0b",
  manager: "#ec4899",
  coordinator: "#10b981",
  player: "#3b82f6",
};

export default function MatchDropsPage() {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [game, setGame] = useState<string>("all");
  const [dropType, setDropType] = useState<string>("all");
  const [passiveId, setPassiveId] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const pidQuery = passiveId.trim();
    return matchesData
      .map((record) => {
        if (game !== "all" && record.game !== game) return null;
        let filteredDrops = record.drops
          .map((drop) => {
            const fullId = `${drop.type}-${drop.id}`;
            const passive = passivesById.get(fullId);
            return { drop, passive, fullId };
          })
          .filter(({ passive }) => passive);
        if (dropType !== "all") {
          filteredDrops = filteredDrops.filter(
            ({ drop }) => drop.type === dropType,
          );
        }
        if (pidQuery) {
          filteredDrops = filteredDrops.filter(
            ({ drop, fullId }) =>
              String(drop.id) === pidQuery ||
              fullId === pidQuery ||
              fullId.includes(pidQuery),
          );
        }
        if (q) {
          const matchNameMatches = record.match.toLowerCase().includes(q);
          const descMatches = filteredDrops.filter(({ passive }) =>
            passive?.description.toLowerCase().includes(q),
          );
          if (!matchNameMatches && descMatches.length === 0) return null;
          if (!matchNameMatches) filteredDrops = descMatches;
        }
        if (filteredDrops.length === 0) return null;
        return { ...record, drops: filteredDrops.map(({ drop }) => drop) };
      })
      .filter(Boolean) as MatchRecord[];
  }, [search, game, dropType, passiveId]);

  const filtersActive =
    search || game !== "all" || dropType !== "all" || passiveId;

  function getRoleLabel(role: string) {
    const key = role.toLowerCase() as
      | "player"
      | "coordinator"
      | "manager"
      | "custom";
    if (["player", "coordinator", "manager", "custom"].includes(key)) {
      return t(`roles.${key}`);
    }
    return role.charAt(0).toUpperCase() + role.slice(1);
  }

  return (
    <div className="p-4">
      <div className="mb-3 rounded-lg border border-card-border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <Search className="size-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("matchDrops.search")}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <Hash className="size-4 text-muted" />
            <input
              type="text"
              value={passiveId}
              onChange={(e) => setPassiveId(e.target.value)}
              placeholder={t("matchDrops.passiveId")}
              className="w-24 bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
          {filtersActive && (
            <button
              onClick={() => {
                setSearch("");
                setGame("all");
                setDropType("all");
                setPassiveId("");
              }}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <RotateCcw className="size-3" />
              {t("common.reset")}
            </button>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <select
            value={game}
            onChange={(e) => setGame(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">{t("matchDrops.allGames")}</option>
            {GAMES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <select
            value={dropType}
            onChange={(e) => setDropType(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">{t("matchDrops.allDropTypes")}</option>
            {DROP_TYPES.slice(1).map((type) => (
              <option key={type} value={type}>
                {getRoleLabel(type)}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-2 text-xs text-muted">
        {t("matchDrops.matches", { count: filtered.length })}
      </div>
      <div className="overflow-hidden rounded-lg border border-card-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-3 py-2.5 w-32">{t("matchDrops.game")}</th>
              <th className="px-3 py-2.5 w-40">{t("matchDrops.match")}</th>
              <th className="px-3 py-2.5">{t("matchDrops.drops")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((record, i) => (
              <tr
                key={`${record.game}-${record.match}-${i}`}
                className="border-b border-border last:border-0"
              >
                <td className="px-3 py-2 align-top font-semibold">
                  {record.game}
                </td>
                <td className="px-3 py-2 align-top font-semibold">
                  {record.match}
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-1.5">
                    {record.drops.map((drop) => {
                      const fullId = `${drop.type}-${drop.id}`;
                      const passive = passivesById.get(fullId);
                      if (!passive) return null;
                      return (
                        <div
                          key={fullId}
                          className="flex flex-wrap items-center gap-2 rounded-md border border-border/50 bg-background/40 px-2 py-1.5 text-xs"
                        >
                          <span
                            className="rounded-[3px] px-2 py-0.5 text-[10px] font-bold uppercase text-white"
                            style={{
                              backgroundColor:
                                TYPE_COLORS[drop.type] || "#6b7280",
                            }}
                          >
                            {getRoleLabel(drop.type)}
                          </span>
                          <span className="rounded-[3px] border border-border bg-card px-1.5 py-0.5 font-mono text-[10px] font-bold">
                            {drop.id}
                          </span>
                          <span className="text-muted">
                            {passive.description}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-12 text-center text-muted">
                  {t("matchDrops.noResults")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
