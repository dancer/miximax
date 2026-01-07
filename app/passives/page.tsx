"use client";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  RotateCcw,
  Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import passivesData from "@/data/passives.json";

type SortKey = "number" | "type" | "stat" | "value";
type SortDir = "asc" | "desc";
const TYPES = ["custom", "player", "coordinator"] as const;
const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  custom: { bg: "#f59e0b", text: "#ffffff" },
  player: { bg: "#3b82f6", text: "#ffffff" },
  coordinator: { bg: "#8b5cf6", text: "#ffffff" },
};
const VISIBLE_COUNT = 50;
export default function PassivesPage() {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("number");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [visible, setVisible] = useState(VISIBLE_COUNT);
  const loaderRef = useRef<HTMLDivElement>(null);
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return passivesData.filter((p) => {
      if (type !== "all" && p.type !== type) return false;
      if (
        q &&
        !p.description.toLowerCase().includes(q) &&
        !p.stat.toLowerCase().includes(q) &&
        !p.value.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [search, type]);
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: string | number, bVal: string | number;
      switch (sortKey) {
        case "number":
          aVal = a.number;
          bVal = b.number;
          break;
        case "type":
          aVal = a.type;
          bVal = b.type;
          break;
        case "stat":
          aVal = a.stat;
          bVal = b.stat;
          break;
        case "value":
          aVal = parseFloat(a.value) || 0;
          bVal = parseFloat(b.value) || 0;
          break;
        default:
          aVal = a.number;
          bVal = b.number;
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
  const filtersActive = search || type !== "all";
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
      setSortDir(key === "number" || key === "value" ? "asc" : "asc");
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
  function getTypeLabel(t: string) {
    return t.charAt(0).toUpperCase() + t.slice(1);
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
              placeholder={t("passives.search")}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">{t("passives.allTypes")}</option>
            {TYPES.map((ty) => (
              <option key={ty} value={ty}>
                {getTypeLabel(ty)}
              </option>
            ))}
          </select>
          {filtersActive && (
            <button
              onClick={() => {
                setSearch("");
                setType("all");
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
        {t("passives.showing", { count: items.length, total: sorted.length })}
      </div>
      <div className="overflow-hidden rounded-lg border border-card-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="w-[60px] px-3 py-2.5 text-center">
                  <SortHeader label="#" k="number" className="justify-center" />
                </th>
                <th className="w-[110px] px-3 py-2.5">
                  <SortHeader label={t("common.type")} k="type" />
                </th>
                <th className="min-w-[300px] px-3 py-2.5">
                  {t("passives.description")}
                </th>
                <th className="w-[140px] px-3 py-2.5">
                  <SortHeader label={t("passives.stat")} k="stat" />
                </th>
                <th className="w-[80px] px-3 py-2.5 text-center">
                  <SortHeader
                    label={t("passives.value")}
                    k="value"
                    className="justify-center"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const colors = TYPE_COLORS[p.type] || {
                  bg: "#6b7280",
                  text: "#ffffff",
                };
                return (
                  <tr
                    key={p.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-accent/5"
                  >
                    <td className="px-3 py-2.5 text-center font-mono text-sm text-muted">
                      {p.number}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className="inline-block rounded-[4px] px-2 py-0.5 text-[10px] font-bold uppercase"
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                        }}
                      >
                        {getTypeLabel(p.type)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-sm">{p.description}</td>
                    <td className="px-3 py-2.5 text-xs text-muted">{p.stat}</td>
                    <td className="px-3 py-2.5 text-center font-mono text-sm font-bold">
                      {p.value}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
          {t("passives.noResults")}
        </div>
      )}
    </div>
  );
}
