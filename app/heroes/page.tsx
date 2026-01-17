"use client";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import ElementIcon from "@/components/ElementIcon";
import Select from "@/components/Select";
import heroesData from "@/data/heroes.json";
import { getAffinityStyle, getPositionStyle } from "@/lib/constants";
import { useSettings } from "@/lib/store";

type Hero = (typeof heroesData)[number];
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

const POSITIONS = [...new Set(heroesData.map((h) => h.position))]
  .filter(Boolean)
  .sort();
const ELEMENTS = [...new Set(heroesData.map((h) => h.element))]
  .filter(Boolean)
  .sort();
const PLAYSTYLES = [...new Set(heroesData.map((h) => h.playstyle))]
  .filter(Boolean)
  .sort();
const VISIBLE_COUNT = 40;

export default function HeroesPage() {
  const t = useTranslations();
  const { jpNames } = useSettings();
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState<string>("all");
  const [element, setElement] = useState<string>("all");
  const [playstyle, setPlaystyle] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [visible, setVisible] = useState(VISIBLE_COUNT);
  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return heroesData.filter((h) => {
      if (position !== "all" && h.position !== position) return false;
      if (element !== "all" && h.element !== element) return false;
      if (playstyle !== "all" && h.playstyle !== playstyle) return false;
      if (
        q &&
        !h.name.toLowerCase().includes(q) &&
        !h.nameJp.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [search, position, element, playstyle]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: string | number, bVal: string | number;
      switch (sortKey) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        default:
          aVal = a[sortKey] as number;
          bVal = b[sortKey] as number;
      }
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

  const items = sorted.slice(0, visible);
  const hasMore = visible < sorted.length;
  const filtersActive =
    search || position !== "all" || element !== "all" || playstyle !== "all";

  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting)
          setVisible((v) => Math.min(v + VISIBLE_COUNT, sorted.length));
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
      setSortDir(key === "name" ? "asc" : "desc");
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
        className={`flex items-center gap-1 whitespace-nowrap text-xs font-semibold uppercase tracking-wide transition-colors hover:text-accent ${className || ""}`}
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

  function getAffinityLabel(affinity: string) {
    const key = affinity.toLowerCase() as
      | "bond"
      | "justice"
      | "counter"
      | "breach";
    if (["bond", "justice", "counter", "breach"].includes(key))
      return t(`affinity.${key}`);
    return affinity;
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
              placeholder={t("heroes.search")}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
          <Select
            value={position}
            onChange={setPosition}
            options={[
              { value: "all", label: t("filters.allPositions") },
              ...POSITIONS.map((p) => ({ value: p, label: p })),
            ]}
          />
          <Select
            value={element}
            onChange={setElement}
            options={[
              { value: "all", label: t("hissatsu.allElements") },
              ...ELEMENTS.map((el) => ({ value: el, label: el })),
            ]}
          />
          <Select
            value={playstyle}
            onChange={setPlaystyle}
            options={[
              { value: "all", label: t("filters.allPlaystyles") },
              ...PLAYSTYLES.map((p) => ({
                value: p,
                label: getAffinityLabel(p),
              })),
            ]}
          />
          {filtersActive && (
            <button
              onClick={() => {
                setSearch("");
                setPosition("all");
                setElement("all");
                setPlaystyle("all");
              }}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <RotateCcw className="size-3" />
              {t("common.reset")}
            </button>
          )}
        </div>
      </div>
      <div className="mb-2 text-xs text-muted">
        {t("heroes.showing", { count: items.length, total: sorted.length })}
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
            {items.map((hero) => {
              const posStyle = getPositionStyle(hero.position);
              const affStyle = getAffinityStyle(hero.playstyle);
              const displayName = jpNames
                ? hero.nameJp || hero.name
                : hero.name;
              const image = hero.image || "";
              return (
                <tr
                  key={hero.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-accent/5 cursor-pointer"
                  onClick={() => setSelectedHero(hero)}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-3">
                      <div className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-border">
                        {image ? (
                          <Image
                            src={image}
                            alt={hero.name}
                            fill
                            sizes="44px"
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-xs text-muted">
                            {hero.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">
                          {displayName}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <span
                            className="flex size-[22px] items-center justify-center rounded-[2px] text-[10px] font-bold text-white"
                            style={{ backgroundColor: posStyle.bg }}
                          >
                            {hero.position}
                          </span>
                          <ElementIcon element={hero.element} />
                          {hero.playstyle && (
                            <span
                              className="rounded-[3px] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                              style={{ backgroundColor: affStyle.bg }}
                            >
                              {getAffinityLabel(hero.playstyle)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-sm">
                    {hero.kick}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-sm">
                    {hero.control}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-sm">
                    {hero.technique}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-sm">
                    {hero.pressure}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-sm">
                    {hero.physical}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-sm">
                    {hero.agility}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-sm">
                    {hero.intelligence}
                  </td>
                  <td className="px-2 py-2 text-center font-mono text-sm font-bold">
                    {hero.total}
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
          {t("heroes.noResults")}
        </div>
      )}
      {selectedHero && (
        <HeroModal hero={selectedHero} onClose={() => setSelectedHero(null)} />
      )}
    </div>
  );
}

function HeroModal({ hero, onClose }: { hero: Hero; onClose: () => void }) {
  const t = useTranslations();
  const { jpNames } = useSettings();
  const posStyle = getPositionStyle(hero.position);
  const displayName = jpNames ? hero.nameJp || hero.name : hero.name;
  const image = hero.image || "";
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 font-mono"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl overflow-hidden border border-border bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <span className="text-xs text-muted">hero/{hero.id}</span>
          <button
            onClick={onClose}
            className="text-muted transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex flex-col lg:flex-row max-h-[85vh] overflow-y-auto lg:overflow-hidden">
          <div className="relative flex shrink-0 items-center justify-center bg-card lg:w-64">
            <div className="flex flex-col items-center p-6">
              <div className="relative size-32 overflow-hidden border border-border">
                {image ? (
                  <Image
                    src={image}
                    alt={hero.name}
                    fill
                    sizes="128px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-2xl text-muted">
                    {hero.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span
                  className="flex size-8 items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: posStyle.bg }}
                >
                  {hero.position}
                </span>
                <ElementIcon element={hero.element} className="size-8" />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto border-t lg:border-l lg:border-t-0 border-border">
            <div className="border-b border-border p-4">
              <h2 className="text-xl font-bold text-foreground">
                {displayName}
              </h2>
              <div className="mt-1 text-xs text-muted">{hero.gender}</div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-border">
              <Stat label="KI" full="Kick" value={hero.kick} />
              <Stat label="CO" full="Control" value={hero.control} />
              <Stat label="TE" full="Technique" value={hero.technique} />
              <Stat label="PR" full="Pressure" value={hero.pressure} />
              <Stat label="PH" full="Physical" value={hero.physical} />
              <Stat label="AG" full="Agility" value={hero.agility} />
              <Stat label="IN" full="Intelligence" value={hero.intelligence} />
              <Stat label="TOT" full="Total" value={hero.total} accent />
            </div>
            {hero.moveset.length > 0 && (
              <div className="p-4">
                <div className="mb-2 text-[10px] uppercase tracking-widest text-muted">
                  {t("heroes.moveset")}
                </div>
                <div className="flex flex-wrap gap-2">
                  {hero.moveset.map((move, i) => (
                    <span
                      key={i}
                      className="border border-border bg-card px-2 py-1 text-xs text-foreground"
                    >
                      {move}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
function Stat({
  label,
  full,
  value,
  accent,
}: {
  label: string;
  full?: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between border-r border-b border-border p-3 last:border-r-0 [&:nth-child(4n)]:border-r-0 lg:[&:nth-child(2n)]:border-r cursor-default"
      title={full}
    >
      <span className="text-[10px] uppercase text-muted">{label}</span>
      <span
        className={`text-lg font-bold ${accent ? "text-accent" : "text-foreground"}`}
      >
        {Math.round(value)}
      </span>
    </div>
  );
}
