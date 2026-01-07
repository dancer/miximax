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
import equipmentData from "@/data/equipment.json";

type SortKey =
  | "name"
  | "type"
  | "shop"
  | "kick"
  | "control"
  | "technique"
  | "pressure"
  | "physical"
  | "intelligence"
  | "agility"
  | "total";
type SortDir = "asc" | "desc";

const TYPES = [...new Set(equipmentData.map((e) => e.type))].sort();
const SHOPS = [...new Set(equipmentData.map((e) => e.shop))]
  .filter(Boolean)
  .sort();
const TYPE_COLORS: Record<string, string> = {
  Boots: "#ef4444",
  Bracelets: "#3b82f6",
  Pendants: "#22c55e",
  Misc: "#f59e0b",
};
const VISIBLE_COUNT = 40;

export default function EquipmentPage() {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [shop, setShop] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("total");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [visible, setVisible] = useState(VISIBLE_COUNT);
  const loaderRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return equipmentData.filter((e) => {
      if (type !== "all" && e.type !== type) return false;
      if (shop !== "all" && e.shop !== shop) return false;
      if (q && !e.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [search, type, shop]);

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
  const filtersActive = search || type !== "all" || shop !== "all";

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
      setSortDir(
        key === "name" || key === "type" || key === "shop" ? "asc" : "desc",
      );
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

  function StatCell({ value }: { value: number }) {
    if (value === 0)
      return (
        <td className="w-[70px] px-3 py-2.5 text-center font-mono text-sm text-muted">
          -
        </td>
      );
    return (
      <td className="w-[70px] px-3 py-2.5 text-center font-mono text-sm font-medium">
        {value}
      </td>
    );
  }

  function getTypeLabel(equipType: string) {
    const key = equipType.toLowerCase() as
      | "boots"
      | "bracelets"
      | "pendants"
      | "misc";
    if (["boots", "bracelets", "pendants", "misc"].includes(key)) {
      return t(`equipmentTypes.${key}`);
    }
    return equipType;
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
              placeholder={t("equipment.search")}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
          {filtersActive && (
            <button
              onClick={() => {
                setSearch("");
                setType("all");
                setShop("all");
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
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">{t("equipment.allTypes")}</option>
            {TYPES.map((equipType) => (
              <option key={equipType} value={equipType}>
                {getTypeLabel(equipType)}
              </option>
            ))}
          </select>
          <select
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">{t("equipment.allShops")}</option>
            {SHOPS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-2 text-xs text-muted">
        {t("equipment.showing", { count: items.length, total: sorted.length })}
      </div>
      <div className="overflow-hidden rounded-lg border border-card-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="min-w-[220px] px-3 py-2.5">
                  <SortHeader label={t("common.name")} k="name" />
                </th>
                <th className="w-[120px] px-3 py-2.5">
                  <SortHeader label={t("common.type")} k="type" />
                </th>
                <th className="w-[100px] px-3 py-2.5">
                  <SortHeader label={t("common.shop")} k="shop" />
                </th>
                <th className="w-[70px] px-3 py-2.5 text-center">
                  <SortHeader label="KI" k="kick" className="justify-center" />
                </th>
                <th className="w-[70px] px-3 py-2.5 text-center">
                  <SortHeader
                    label="CO"
                    k="control"
                    className="justify-center"
                  />
                </th>
                <th className="w-[70px] px-3 py-2.5 text-center">
                  <SortHeader
                    label="TE"
                    k="technique"
                    className="justify-center"
                  />
                </th>
                <th className="w-[70px] px-3 py-2.5 text-center">
                  <SortHeader
                    label="PR"
                    k="pressure"
                    className="justify-center"
                  />
                </th>
                <th className="w-[70px] px-3 py-2.5 text-center">
                  <SortHeader
                    label="PH"
                    k="physical"
                    className="justify-center"
                  />
                </th>
                <th className="w-[70px] px-3 py-2.5 text-center">
                  <SortHeader
                    label="IN"
                    k="intelligence"
                    className="justify-center"
                  />
                </th>
                <th className="w-[70px] px-3 py-2.5 text-center">
                  <SortHeader
                    label="AG"
                    k="agility"
                    className="justify-center"
                  />
                </th>
                <th className="w-[80px] px-3 py-2.5 text-center">
                  <SortHeader
                    label={t("stats.total")}
                    k="total"
                    className="justify-center"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((eq, index) => {
                const typeColor = TYPE_COLORS[eq.type] || "#6b7280";
                return (
                  <tr
                    key={`${eq.id}-${index}`}
                    className="border-b border-border last:border-0 transition-colors hover:bg-accent/5"
                  >
                    <td className="min-w-[220px] px-3 py-2.5 font-semibold">
                      {eq.name}
                    </td>
                    <td className="w-[120px] px-3 py-2.5">
                      <span
                        className="inline-block rounded-[4px] px-2.5 py-0.5 text-[11px] font-bold uppercase text-white"
                        style={{ backgroundColor: typeColor }}
                      >
                        {getTypeLabel(eq.type)}
                      </span>
                    </td>
                    <td className="w-[100px] px-3 py-2.5">
                      <span className="rounded-[4px] border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                        {eq.shop || "-"}
                      </span>
                    </td>
                    <StatCell value={eq.kick} />
                    <StatCell value={eq.control} />
                    <StatCell value={eq.technique} />
                    <StatCell value={eq.pressure} />
                    <StatCell value={eq.physical} />
                    <StatCell value={eq.intelligence} />
                    <StatCell value={eq.agility} />
                    <td className="w-[80px] px-3 py-2.5 text-center font-mono text-sm font-bold text-accent">
                      {eq.total}
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
          {t("equipment.noResults")}
        </div>
      )}
    </div>
  );
}
