"use client";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Info,
  RotateCcw,
  Search,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import ElementIcon from "@/components/ElementIcon";
import hyperMovesData from "@/data/hyper-moves.json";

type SortKey = "name" | "type" | "element" | "power";
type SortDir = "asc" | "desc";

const TYPES = [...new Set(hyperMovesData.map((h) => h.type))]
  .filter(Boolean)
  .sort();
const ELEMENTS = [
  ...new Set(hyperMovesData.map((h) => normalizeElement(h.element))),
]
  .filter(Boolean)
  .sort();
const TYPE_COLORS: Record<string, string> = {
  Awakening: "#8b5cf6",
  Keshin: "#3b82f6",
  Totem: "#22c55e",
};
const VISIBLE_COUNT = 30;

function normalizeElement(el: string): string {
  if (!el) return "";
  if (el.includes("Fire") || el.includes("火")) return "Fire";
  if (el.includes("Wind") || el.includes("風")) return "Wind";
  if (el.includes("Mountain") || el.includes("山")) return "Mountain";
  if (el.includes("Forest") || el.includes("林")) return "Forest";
  if (el.includes("Void") || el.includes("無")) return "Void";
  return el;
}

export default function HyperMovesPage() {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [type, setType] = useState<string>("all");
  const [element, setElement] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [visible, setVisible] = useState(VISIBLE_COUNT);
  const loaderRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return hyperMovesData.filter((h) => {
      if (type !== "all" && h.type !== type) return false;
      if (element !== "all" && normalizeElement(h.element) !== element)
        return false;
      if (
        q &&
        !h.name.toLowerCase().includes(q) &&
        !h.passive.toLowerCase().includes(q) &&
        !h.hissatsuName.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [search, type, element]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: string | number, bVal: string | number;
      switch (sortKey) {
        case "name":
          aVal = a.name;
          bVal = b.name;
          break;
        case "type":
          aVal = a.type;
          bVal = b.type;
          break;
        case "element":
          aVal = normalizeElement(a.element);
          bVal = normalizeElement(b.element);
          break;
        case "power":
          aVal = a.power;
          bVal = b.power;
          break;
        default:
          aVal = a.name;
          bVal = b.name;
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
  const filtersActive = search || type !== "all" || element !== "all";

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
      setSortDir(key === "power" ? "desc" : "asc");
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

  function getTypeLabel(hyperType: string) {
    const key = hyperType.toLowerCase() as "awakening" | "keshin" | "totem";
    if (["awakening", "keshin", "totem"].includes(key)) {
      return t(`hyperMoveTypes.${key}`);
    }
    return hyperType;
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
              placeholder={t("hyperMoves.search")}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </div>
          {filtersActive && (
            <button
              onClick={() => {
                setSearch("");
                setType("all");
                setElement("all");
              }}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <RotateCcw className="size-3" />
              {t("common.reset")}
            </button>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">{t("hyperMoves.allTypes")}</option>
            {TYPES.map((hType) => (
              <option key={hType} value={hType}>
                {getTypeLabel(hType)}
              </option>
            ))}
          </select>
          <select
            value={element}
            onChange={(e) => setElement(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="all">{t("hyperMoves.allElements")}</option>
            {ELEMENTS.map((el) => (
              <option key={el} value={el}>
                {getElementLabel(el)}
              </option>
            ))}
          </select>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-muted">
            <Info className="size-3.5" />
            {t("hyperMoves.note")}
          </span>
        </div>
      </div>
      <div className="mb-2 text-xs text-muted">
        {t("hyperMoves.showing", { count: items.length, total: sorted.length })}
      </div>
      <div className="overflow-hidden rounded-lg border border-card-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-muted">
                <th className="w-[200px] min-w-[200px] px-3 py-2.5">
                  <SortHeader label={t("common.name")} k="name" />
                </th>
                <th className="w-[100px] px-3 py-2.5">
                  <SortHeader label={t("common.type")} k="type" />
                </th>
                <th className="w-[60px] px-3 py-2.5">
                  <SortHeader label={t("common.element")} k="element" />
                </th>
                <th className="min-w-[250px] px-3 py-2.5">
                  {t("hyperMoves.passiveEffects")}
                </th>
                <th className="w-[180px] px-3 py-2.5">{t("nav.hissatsu")}</th>
                <th className="w-[80px] px-2 py-2.5 text-center">
                  <SortHeader
                    label={t("common.power")}
                    k="power"
                    className="justify-center"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((move) => {
                const typeColor = TYPE_COLORS[move.type] || "#6b7280";
                const normalEl = normalizeElement(move.element);
                return (
                  <tr
                    key={move.id}
                    className="border-b border-border last:border-0 transition-colors hover:bg-accent/5"
                  >
                    <td className="px-3 py-2.5 font-semibold">{move.name}</td>
                    <td className="px-3 py-2.5">
                      <span
                        className="inline-block rounded-[4px] px-2.5 py-0.5 text-[11px] font-bold uppercase text-white"
                        style={{ backgroundColor: typeColor }}
                      >
                        {getTypeLabel(move.type)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      {normalEl ? (
                        <ElementIcon element={normalEl} />
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-sm leading-relaxed whitespace-pre-line">
                        {move.passive || <span className="text-muted">-</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      {move.hissatsuName ? (
                        <div>
                          <div className="font-medium">{move.hissatsuName}</div>
                          {move.hissatsuType && (
                            <div className="text-xs text-muted">
                              {move.hissatsuType}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 text-center font-mono text-sm font-bold">
                      {move.power || "-"}
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
          {t("hyperMoves.noResults")}
        </div>
      )}
    </div>
  );
}
