"use client";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Footprints,
  Hand,
  RotateCcw,
  Search,
  Shield,
  Target,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import ElementIcon from "@/components/ElementIcon";
import Select from "@/components/Select";
import abilitiesData from "@/data/abilities.json";

type SortKey = "name" | "power" | "tp" | "shop" | "type" | "element";
type SortDir = "asc" | "desc";

const TYPE_COLORS: Record<string, string> = {
  Shoot: "#ef4444",
  Dribble: "#22c55e",
  Block: "#3b82f6",
  Catch: "#f59e0b",
  Keep: "#8b5cf6",
};
const TYPE_ICONS: Record<string, typeof Target> = {
  Shoot: Target,
  Dribble: Footprints,
  Block: Shield,
  Catch: Hand,
  Keep: Hand,
};
const EXTRA_COLORS: Record<string, string> = {
  "Long Shoot": "#6366f1",
  "Counter Shoot": "#ec4899",
  "Shoot Block": "#14b8a6",
};

function normalizeElement(el: string): string {
  if (el.includes("Fire") || el.includes("火")) return "Fire";
  if (el.includes("Wind") || el.includes("風") || el.includes("Air"))
    return "Wind";
  if (el.includes("Mountain") || el.includes("山")) return "Mountain";
  if (el.includes("Forest") || el.includes("林")) return "Forest";
  if (el.includes("Void") || el.includes("無")) return "Void";
  return el;
}

const ELEMENTS = [
  ...new Set(abilitiesData.map((a) => normalizeElement(a.element))),
]
  .filter(Boolean)
  .sort();
const TYPES = [...new Set(abilitiesData.map((a) => a.type))]
  .filter(Boolean)
  .sort();
const SHOPS = [...new Set(abilitiesData.map((a) => a.shop))]
  .filter(Boolean)
  .sort();
const EXTRAS = [...new Set(abilitiesData.map((a) => a.extra))]
  .filter(Boolean)
  .sort();
const VISIBLE_COUNT = 40;

export default function AbilitiesPage() {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [element, setElement] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [shop, setShop] = useState<string>("all");
  const [extra, setExtra] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("power");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [visible, setVisible] = useState(VISIBLE_COUNT);
  const loaderRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return abilitiesData.filter((a) => {
      if (element !== "all" && normalizeElement(a.element) !== element)
        return false;
      if (type !== "all" && a.type !== type) return false;
      if (shop !== "all" && a.shop !== shop) return false;
      if (extra !== "all" && a.extra !== extra) return false;
      if (
        q &&
        !a.name.toLowerCase().includes(q) &&
        !(a.nameJp || "").toLowerCase().includes(q) &&
        !a.shop.toLowerCase().includes(q) &&
        !(a.extra || "").toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [search, element, type, shop, extra]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: string | number, bVal: string | number;
      switch (sortKey) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "power":
          aVal = a.power;
          bVal = b.power;
          break;
        case "tp":
          aVal = a.tp;
          bVal = b.tp;
          break;
        case "shop":
          aVal = a.shop;
          bVal = b.shop;
          break;
        case "type":
          aVal = a.type;
          bVal = b.type;
          break;
        case "element":
          aVal = normalizeElement(a.element);
          bVal = normalizeElement(b.element);
          break;
        default:
          aVal = a.power;
          bVal = b.power;
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
    search ||
    element !== "all" ||
    type !== "all" ||
    shop !== "all" ||
    extra !== "all";

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
        key === "name" || key === "shop" || key === "type" || key === "element"
          ? "asc"
          : "desc",
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

  function getElementLabel(el: string) {
    const key = el.toLowerCase() as
      | "fire"
      | "wind"
      | "mountain"
      | "forest"
      | "void";
    if (["fire", "wind", "mountain", "forest", "void"].includes(key)) {
      return t(`elements.${key}`);
    }
    return el;
  }

  function getTypeLabel(hissatsuType: string) {
    const key = hissatsuType.toLowerCase() as
      | "shoot"
      | "dribble"
      | "block"
      | "catch"
      | "keep";
    if (["shoot", "dribble", "block", "catch", "keep"].includes(key)) {
      return t(`hissatsuTypes.${key}`);
    }
    return hissatsuType;
  }

  function getExtraLabel(extraType: string) {
    const keyMap: Record<string, string> = {
      "Long Shoot": "longShoot",
      "Counter Shoot": "counterShoot",
      "Shoot Block": "shootBlock",
    };
    const key = keyMap[extraType];
    if (key) {
      return t(`hissatsuExtras.${key}`);
    }
    return extraType;
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
              placeholder={t("hissatsu.search")}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
          <Select
            value={type}
            onChange={setType}
            options={[
              { value: "all", label: t("hissatsu.allTypes") },
              ...TYPES.map((hType) => ({
                value: hType,
                label: getTypeLabel(hType),
              })),
            ]}
          />
          <Select
            value={element}
            onChange={setElement}
            options={[
              { value: "all", label: t("hissatsu.allElements") },
              ...ELEMENTS.map((el) => ({
                value: el,
                label: getElementLabel(el),
              })),
            ]}
          />
          <Select
            value={shop}
            onChange={setShop}
            options={[
              { value: "all", label: t("hissatsu.allShops") },
              ...SHOPS.map((s) => ({ value: s, label: s })),
            ]}
          />
          {EXTRAS.length > 0 && (
            <Select
              value={extra}
              onChange={setExtra}
              options={[
                { value: "all", label: t("hissatsu.allExtras") },
                ...EXTRAS.map((ex) => ({
                  value: ex,
                  label: getExtraLabel(ex),
                })),
              ]}
            />
          )}
          {filtersActive && (
            <button
              onClick={() => {
                setSearch("");
                setElement("all");
                setType("all");
                setShop("all");
                setExtra("all");
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
        {t("hissatsu.showing", { count: items.length, total: sorted.length })}
      </div>
      <div className="overflow-hidden rounded-lg border border-card-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="w-[180px] min-w-[180px] px-3 py-2.5">
                  <SortHeader label={t("common.shop")} k="shop" />
                </th>
                <th className="w-[110px] px-3 py-2.5">
                  <SortHeader label={t("common.type")} k="type" />
                </th>
                <th className="w-[60px] px-3 py-2.5">
                  <SortHeader label={t("common.element")} k="element" />
                </th>
                <th className="min-w-[220px] px-3 py-2.5">
                  <SortHeader label={t("nav.hissatsu")} k="name" />
                </th>
                <th className="w-[80px] px-2 py-2.5 text-center">
                  <SortHeader
                    label={t("common.power")}
                    k="power"
                    className="justify-center"
                  />
                </th>
                <th className="w-[80px] px-2 py-2.5 text-center">
                  <SortHeader
                    label={t("common.tension")}
                    k="tp"
                    className="justify-center"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((ability, i) => {
                const normalEl = normalizeElement(ability.element);
                const typeColor = TYPE_COLORS[ability.type] || "#6b7280";
                const TypeIcon = TYPE_ICONS[ability.type] || Target;
                const extraColor = EXTRA_COLORS[ability.extra] || "#6b7280";
                return (
                  <tr
                    key={`${ability.name}-${i}`}
                    className="border-b border-border last:border-0 transition-colors hover:bg-accent/5"
                  >
                    <td className="w-[180px] px-3 py-2.5">
                      <span
                        className="inline-block max-w-full truncate rounded-[4px] border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent"
                        title={ability.shop}
                      >
                        {ability.shop || "-"}
                      </span>
                    </td>
                    <td className="w-[110px] px-3 py-2.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-[4px] px-2 py-0.5 text-[11px] font-bold uppercase text-white"
                        style={{ backgroundColor: typeColor }}
                      >
                        <TypeIcon className="size-3.5" />
                        {getTypeLabel(ability.type)}
                      </span>
                    </td>
                    <td className="w-[60px] px-3 py-2.5">
                      <ElementIcon element={normalEl} />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{ability.name}</span>
                        {ability.extra && (
                          <span
                            className="rounded-[4px] border px-1.5 py-0.5 text-[9px] font-bold uppercase"
                            style={{
                              borderColor: extraColor,
                              color: extraColor,
                            }}
                          >
                            {getExtraLabel(ability.extra)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-center font-mono text-sm font-bold">
                      {ability.power}
                    </td>
                    <td className="px-2 py-2.5 text-center font-mono text-sm">
                      {ability.tp}
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
          {t("hissatsu.noResults")}
        </div>
      )}
    </div>
  );
}
