"use client";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  RotateCcw,
  Search,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import ElementIcon from "@/components/ElementIcon";
import PlayerModal from "@/components/PlayerModal";
import Select from "@/components/Select";
import rawPlayersData from "@/data/players.json";
import {
  ELEMENTS,
  getAffinityStyle,
  getPositionStyle,
  POSITIONS,
} from "@/lib/constants";
import { getJpName } from "@/lib/names";
import { useSettings } from "@/lib/store";

type Player = {
  id: number;
  name: string;
  nickname: string;
  image: string;
  modelUrl?: string;
  fullbodyBase?: string;
  game: string;
  position: string;
  altPosition?: string;
  element: string;
  affinity: string;
  role: string;
  kick: number;
  control: number;
  technique: number;
  pressure: number;
  physical: number;
  agility: number;
  intelligence: number;
  total: number;
  ageGroup: string;
  year: string;
  gender: string;
};
const playersData = rawPlayersData as Player[];

const AFFINITIES = [
  ...new Set(
    playersData
      .map((p) => p.affinity)
      .filter((a) => a && a !== "#N/A" && a !== "Unknown"),
  ),
].sort();

const ROLES = [
  ...new Set(playersData.map((p) => p.role).filter(Boolean)),
].sort();
type SortKey =
  | "name"
  | "total"
  | "kick"
  | "control"
  | "technique"
  | "pressure"
  | "physical"
  | "agility"
  | "intelligence";
type SortDir = "asc" | "desc";

const VISIBLE_COUNT = 30;

export default function PlayersPage() {
  const t = useTranslations();
  const { jpNames } = useSettings();
  const [search, setSearch] = useState("");
  const [element, setElement] = useState<string>("all");
  const [position, setPosition] = useState<string>("all");
  const [affinity, setAffinity] = useState<string>("all");
  const [role, setRole] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("kick");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [visible, setVisible] = useState(VISIBLE_COUNT);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return playersData.filter((p) => {
      if (!p.name || p.name === "???" || p.name.trim() === "") return false;
      if (element !== "all" && p.element !== element) return false;
      if (position !== "all" && p.position !== position) return false;
      if (affinity !== "all" && p.affinity !== affinity) return false;
      if (role !== "all" && p.role !== role) return false;
      if (q) {
        const enName = p.name.toLowerCase();
        const jpName = getJpName(p.name).toLowerCase();
        const enNick = (p.nickname || "").toLowerCase();
        const jpNick = getJpName(p.nickname).toLowerCase();
        if (
          !enName.includes(q) &&
          !jpName.includes(q) &&
          !enNick.includes(q) &&
          !jpNick.includes(q)
        )
          return false;
      }
      return true;
    });
  }, [search, element, position, affinity, role]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = sortKey === "name" ? a.name : a[sortKey];
      const bVal = sortKey === "name" ? b.name : b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDir === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [filtered, sortKey, sortDir]);

  const players = sorted.slice(0, visible);
  const hasMore = visible < sorted.length;
  const filtersActive =
    search ||
    element !== "all" ||
    position !== "all" ||
    affinity !== "all" ||
    role !== "all";

  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible((v) => Math.min(v + VISIBLE_COUNT, sorted.length));
        }
      },
      { rootMargin: "200px" },
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, sorted.length]);

  useEffect(() => {
    setVisible(VISIBLE_COUNT);
  }, []);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortHeader({
    label,
    k,
    className,
  }: {
    label: string;
    k: SortKey;
    className?: string;
  }) {
    const isActive = sortKey === k;
    return (
      <button
        onClick={() => handleSort(k)}
        className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors hover:text-accent ${className}`}
      >
        {label}
        {isActive ? (
          sortDir === "asc" ? (
            <ArrowUp className="size-3 text-accent" />
          ) : (
            <ArrowDown className="size-3 text-accent" />
          )
        ) : (
          <ArrowUpDown className="size-3 opacity-30" />
        )}
      </button>
    );
  }

  function displayName(player: Player) {
    return jpNames ? getJpName(player.name) : player.name;
  }

  function getAffinityLabel(affinity: string) {
    const key = affinity.toLowerCase() as
      | "bond"
      | "justice"
      | "counter"
      | "breach";
    if (["bond", "justice", "counter", "breach"].includes(key)) {
      return t(`affinity.${key}`);
    }
    return affinity;
  }

  function getRoleLabel(role: string) {
    const key = role.toLowerCase() as
      | "player"
      | "coordinator"
      | "manager"
      | "coach";
    if (["player", "coordinator", "manager", "coach"].includes(key)) {
      return t(`roles.${key}`);
    }
    return role;
  }

  return (
    <div className="p-4">
      <div className="mb-3 rounded-lg border border-card-border bg-card p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <Search className="size-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("players.search")}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
          <Select
            value={element}
            onChange={setElement}
            options={[
              { value: "all", label: t("players.allElements") },
              ...ELEMENTS.map((e) => ({
                value: e,
                label: t(`elements.${e.toLowerCase()}`),
              })),
            ]}
          />
          <Select
            value={position}
            onChange={setPosition}
            options={[
              { value: "all", label: t("players.allPositions") },
              ...POSITIONS.map((p) => ({ value: p, label: p })),
            ]}
          />
          <Select
            value={affinity}
            onChange={setAffinity}
            options={[
              { value: "all", label: t("filters.allPlaystyles") },
              ...AFFINITIES.map((a) => ({
                value: a,
                label: getAffinityLabel(a),
              })),
            ]}
          />
          <Select
            value={role}
            onChange={setRole}
            options={[
              { value: "all", label: t("filters.allRoles") },
              ...ROLES.map((r) => ({ value: r, label: getRoleLabel(r) })),
            ]}
          />
          {filtersActive && (
            <button
              onClick={() => {
                setSearch("");
                setElement("all");
                setPosition("all");
                setAffinity("all");
                setRole("all");
              }}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <RotateCcw className="size-3" />
              {t("common.reset")}
            </button>
          )}
        </div>
      </div>
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>
          {t("players.showing", {
            count: players.length,
            total: sorted.length.toLocaleString(),
          })}
        </span>
        <span>{t("players.statsNote")}</span>
      </div>
      <div className="overflow-hidden rounded-lg border border-card-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="w-[280px] px-3 py-2.5">
                <SortHeader label={t("common.player")} k="name" />
              </th>
              <th className="px-2 py-2.5 text-center">
                <SortHeader
                  label={t("stats.kick")}
                  k="kick"
                  className="justify-center"
                />
              </th>
              <th className="px-2 py-2.5 text-center">
                <SortHeader
                  label={t("stats.control")}
                  k="control"
                  className="justify-center"
                />
              </th>
              <th className="px-2 py-2.5 text-center">
                <SortHeader
                  label={t("stats.technique")}
                  k="technique"
                  className="justify-center"
                />
              </th>
              <th className="px-2 py-2.5 text-center">
                <SortHeader
                  label={t("stats.pressure")}
                  k="pressure"
                  className="justify-center"
                />
              </th>
              <th className="px-2 py-2.5 text-center">
                <SortHeader
                  label={t("stats.physical")}
                  k="physical"
                  className="justify-center"
                />
              </th>
              <th className="px-2 py-2.5 text-center">
                <SortHeader
                  label={t("stats.agility")}
                  k="agility"
                  className="justify-center"
                />
              </th>
              <th className="px-2 py-2.5 text-center">
                <SortHeader
                  label={t("stats.intelligence")}
                  k="intelligence"
                  className="justify-center"
                />
              </th>
              <th className="px-2 py-2.5 text-center">
                <SortHeader
                  label={t("stats.total")}
                  k="total"
                  className="justify-center"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => {
              const posStyle = getPositionStyle(player.position);
              const affStyle = getAffinityStyle(player.affinity);
              return (
                <tr
                  key={player.id}
                  onClick={() => setSelectedPlayer(player)}
                  className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-accent/5"
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-border">
                        <Image
                          src={player.image}
                          alt={player.name}
                          fill
                          sizes="44px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">
                          {displayName(player)}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span
                            className="flex size-[22px] items-center justify-center rounded-[2px] text-[10px] font-bold text-white"
                            style={{ backgroundColor: posStyle.bg }}
                          >
                            {player.position}
                          </span>
                          <ElementIcon element={player.element} />
                          {player.affinity && player.affinity !== "Unknown" && (
                            <span
                              className="rounded-[3px] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                              style={{ backgroundColor: affStyle.bg }}
                            >
                              {getAffinityLabel(player.affinity)}
                            </span>
                          )}
                          {player.role && (
                            <span className="rounded-[3px] border border-border px-1.5 py-0.5 text-[10px] text-muted">
                              {getRoleLabel(player.role)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-sm">
                    {player.kick}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-sm">
                    {player.control}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-sm">
                    {player.technique}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-sm">
                    {player.pressure}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-sm">
                    {player.physical}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-sm">
                    {player.agility}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-sm">
                    {player.intelligence}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-sm font-bold">
                    {player.total}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div
          ref={loaderRef}
          className="flex h-12 items-center justify-center text-sm text-muted"
        >
          {t("common.loading")}
        </div>
      )}
      {sorted.length === 0 && (
        <div className="mt-8 text-center text-muted">
          {t("players.noResults")}
        </div>
      )}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
