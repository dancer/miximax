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
import kizunaData from "@/data/kizuna-items.json";

type SortKey = "name" | "power" | "size";
type SortDir = "asc" | "desc";

const SIZES = [...new Set(kizunaData.map((k) => k.size))]
  .filter(Boolean)
  .sort();
const SHOPS = [...new Set(kizunaData.map((k) => k.shop))]
  .filter(Boolean)
  .sort();
const VISIBLE_COUNT = 50;

export default function KizunaPage() {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [size, setSize] = useState<string>("all");
  const [shop, setShop] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("power");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [visible, setVisible] = useState(VISIBLE_COUNT);
  const loaderRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return kizunaData.filter((k) => {
      if (size !== "all" && k.size !== size) return false;
      if (shop !== "all" && k.shop !== shop) return false;
      if (
        q &&
        !k.name.toLowerCase().includes(q) &&
        !k.notes.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [search, size, shop]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: string | number, bVal: string | number;
      switch (sortKey) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "size": {
          const sizeOrder: Record<string, number> = { S: 1, M: 2, L: 3 };
          aVal = sizeOrder[a.size] || 0;
          bVal = sizeOrder[b.size] || 0;
          break;
        }
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
  const filtersActive = search || size !== "all" || shop !== "all";

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

  function getSizeStyle(s: string) {
    switch (s) {
      case "S":
        return { bg: "bg-emerald-500", text: "Small" };
      case "M":
        return { bg: "bg-blue-500", text: "Medium" };
      case "L":
        return { bg: "bg-purple-500", text: "Large" };
      default:
        return { bg: "bg-gray-500", text: s };
    }
  }

  function getPowerColor(power: number) {
    if (power >= 300) return "text-purple-400";
    if (power >= 100) return "text-blue-400";
    if (power >= 50) return "text-emerald-400";
    return "text-muted";
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
              placeholder={t("kizuna.search")}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">{t("kizuna.allSizes")}</option>
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {getSizeStyle(s).text} ({s})
              </option>
            ))}
          </select>
          <select
            value={shop}
            onChange={(e) => setShop(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">{t("kizuna.allShops")}</option>
            {SHOPS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {filtersActive && (
            <button
              onClick={() => {
                setSearch("");
                setSize("all");
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
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>
          {t("kizuna.showing", { count: items.length, total: sorted.length })}
        </span>
        <div className="flex gap-3">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-emerald-500" /> S:{" "}
            {kizunaData.filter((k) => k.size === "S").length}
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-blue-500" /> M:{" "}
            {kizunaData.filter((k) => k.size === "M").length}
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-purple-500" /> L:{" "}
            {kizunaData.filter((k) => k.size === "L").length}
          </span>
        </div>
      </div>
      <div className="overflow-hidden rounded-lg border border-card-border bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border text-left text-muted">
              <th className="px-3 py-2.5">
                <SortHeader label={t("kizuna.name")} k="name" />
              </th>
              <th className="w-24 px-3 py-2.5 text-center">
                <SortHeader
                  label={t("kizuna.size")}
                  k="size"
                  className="justify-center"
                />
              </th>
              <th className="w-24 px-3 py-2.5 text-center">
                <SortHeader
                  label={t("kizuna.power")}
                  k="power"
                  className="justify-center"
                />
              </th>
              <th className="w-52 px-3 py-2.5">{t("kizuna.shop")}</th>
              <th className="px-3 py-2.5">{t("kizuna.notes")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const sizeStyle = getSizeStyle(item.size);
              return (
                <tr
                  key={item.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-accent/5"
                >
                  <td className="px-3 py-2.5 text-sm font-medium">
                    {item.name}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold text-white ${sizeStyle.bg}`}
                    >
                      {item.size}
                    </span>
                  </td>
                  <td
                    className={`px-3 py-2.5 text-center font-mono text-sm font-semibold ${getPowerColor(item.power)}`}
                  >
                    {item.power}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-muted">
                    {item.shop}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted">
                    {item.notes}
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
          {t("kizuna.noResults")}
        </div>
      )}
    </div>
  );
}
