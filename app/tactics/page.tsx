"use client";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Clock,
  RotateCcw,
  Search,
  Timer,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import Select from "@/components/Select";
import tacticsData from "@/data/tactics.json";

type SortKey = "name" | "shop" | "duration" | "cooldown";
type SortDir = "asc" | "desc";

const SHOPS = [...new Set(tacticsData.map((t) => t.shop))]
  .filter(Boolean)
  .sort();
const VISIBLE_COUNT = 30;

export default function TacticsPage() {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [shop, setShop] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [visible, setVisible] = useState(VISIBLE_COUNT);
  const loaderRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return tacticsData.filter((tactic) => {
      if (shop !== "all" && tactic.shop !== shop) return false;
      if (
        q &&
        !tactic.name.toLowerCase().includes(q) &&
        !tactic.effect1.toLowerCase().includes(q) &&
        !tactic.effect2.toLowerCase().includes(q) &&
        !tactic.effect3.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [search, shop]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
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
  const filtersActive = search || shop !== "all";

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
      setSortDir(key === "name" || key === "shop" ? "asc" : "desc");
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
              placeholder={t("tactics.search")}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
          <Select
            value={shop}
            onChange={setShop}
            options={[
              { value: "all", label: t("tactics.allShops") },
              ...SHOPS.map((s) => ({ value: s, label: s })),
            ]}
          />
          {filtersActive && (
            <button
              onClick={() => {
                setSearch("");
                setShop("all");
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
        {t("tactics.showing", { count: items.length, total: sorted.length })}
      </div>
      <div className="overflow-hidden rounded-lg border border-card-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="w-[180px] min-w-[180px] px-3 py-2.5">
                  <SortHeader label={t("common.name")} k="name" />
                </th>
                <th className="w-[180px] px-3 py-2.5">
                  <SortHeader label={t("common.shop")} k="shop" />
                </th>
                <th className="min-w-[200px] px-3 py-2.5">
                  {t("tactics.effect1")}
                </th>
                <th className="min-w-[200px] px-3 py-2.5">
                  {t("tactics.effect2")}
                </th>
                <th className="min-w-[200px] px-3 py-2.5">
                  {t("tactics.effect3")}
                </th>
                <th className="w-[90px] px-2 py-2.5 text-center">
                  <SortHeader
                    label={t("common.duration")}
                    k="duration"
                    className="justify-center"
                  />
                </th>
                <th className="w-[90px] px-2 py-2.5 text-center">
                  <SortHeader
                    label={t("common.cooldown")}
                    k="cooldown"
                    className="justify-center"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((tactic) => (
                <tr
                  key={tactic.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-accent/5"
                >
                  <td className="px-3 py-2.5 font-semibold">{tactic.name}</td>
                  <td className="w-[180px] px-3 py-2.5">
                    <span
                      className="inline-block max-w-full truncate rounded-[4px] border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent"
                      title={tactic.shop}
                    >
                      {tactic.shop}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-sm">
                    {tactic.effect1 || <span className="text-muted">-</span>}
                  </td>
                  <td className="px-3 py-2.5 text-sm">
                    {tactic.effect2 || <span className="text-muted">-</span>}
                  </td>
                  <td className="px-3 py-2.5 text-sm">
                    {tactic.effect3 || <span className="text-muted">-</span>}
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span className="inline-flex items-center gap-1 font-mono text-sm">
                      <Clock className="size-3 text-muted" />
                      {tactic.duration || "-"}s
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span className="inline-flex items-center gap-1 font-mono text-sm">
                      <Timer className="size-3 text-muted" />
                      {tactic.cooldown}s
                    </span>
                  </td>
                </tr>
              ))}
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
          {t("tactics.noResults")}
        </div>
      )}
    </div>
  );
}
