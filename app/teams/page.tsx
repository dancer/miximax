"use client";
import { Download, Share2, Trash2, Upload, X } from "lucide-react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import ElementIcon from "@/components/ElementIcon";
import Select from "@/components/Select";
import rawPlayersData from "@/data/players.json";
import {
  FORMATIONS,
  type Formation,
  POSITION_COLORS,
  type PositionCode,
} from "@/lib/formations";
import { getJpName } from "@/lib/names";
import { useSettings } from "@/lib/store";

type Player = {
  id: number;
  name: string;
  nickname: string;
  image: string;
  position: string;
  element: string;
  kick: number;
  control: number;
  technique: number;
  pressure: number;
  physical: number;
  agility: number;
  intelligence: number;
  total: number;
  [key: string]: unknown;
};
const playersData = rawPlayersData as Player[];
type SlotPlayer = {
  slotId: string;
  player: Player | null;
  position?: PositionCode;
};
const RESERVE_SLOTS = 5;
export default function TeamsPage() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const { jpNames } = useSettings();
  const [formation, setFormation] = useState<Formation>(FORMATIONS[0]);
  const [slots, setSlots] = useState<SlotPlayer[]>([
    ...FORMATIONS[0].slots.map((s) => ({
      slotId: s.id,
      player: null,
      position: s.label,
    })),
    ...Array.from({ length: RESERVE_SLOTS }, (_, i) => ({
      slotId: `reserve-${i}`,
      player: null,
    })),
  ]);
  const [teamName, setTeamName] = useState("My Team");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [searchPlayer, setSearchPlayer] = useState("");
  const [loaded, setLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (loaded) return;
    const teamData = searchParams.get("t");
    if (teamData) {
      try {
        const data = JSON.parse(atob(teamData));
        if (data.n) setTeamName(data.n);
        if (data.f) {
          const f = FORMATIONS.find((f) => f.id === data.f);
          if (f) {
            setFormation(f);
            if (data.p) {
              const playerMap = new Map(
                data.p.split(",").map((p: string) => p.split(":")),
              );
              const newSlots = [
                ...f.slots.map((s) => {
                  const playerId = playerMap.get(s.id);
                  const player = playerId
                    ? playersData.find((p) => p.id === Number(playerId)) || null
                    : null;
                  return { slotId: s.id, player, position: s.label };
                }),
                ...Array.from({ length: RESERVE_SLOTS }, (_, i) => {
                  const playerId = playerMap.get(`reserve-${i}`);
                  const player = playerId
                    ? playersData.find((p) => p.id === Number(playerId)) || null
                    : null;
                  return { slotId: `reserve-${i}`, player };
                }),
              ];
              setSlots(newSlots);
            }
          }
        }
      } catch {}
    }
    setLoaded(true);
  }, [searchParams, loaded]);

  const filledCount = slots.filter(
    (s) => s.player && !s.slotId.startsWith("reserve"),
  ).length;
  const reserveCount = slots.filter(
    (s) => s.player && s.slotId.startsWith("reserve"),
  ).length;

  const selectedSlotData = selectedSlot
    ? formation.slots.find((s) => s.id === selectedSlot)
    : null;
  const selectedPosition = selectedSlotData?.label;

  const teamStats = useMemo(() => {
    const activePlayers = slots
      .filter(
        (s): s is SlotPlayer & { player: Player } =>
          s.player !== null && !s.slotId.startsWith("reserve"),
      )
      .map((s) => s.player);
    if (activePlayers.length === 0) return null;
    return {
      kick: activePlayers.reduce((sum, p) => sum + p.kick, 0),
      control: activePlayers.reduce((sum, p) => sum + p.control, 0),
      technique: activePlayers.reduce((sum, p) => sum + p.technique, 0),
      pressure: activePlayers.reduce((sum, p) => sum + p.pressure, 0),
      physical: activePlayers.reduce((sum, p) => sum + p.physical, 0),
      agility: activePlayers.reduce((sum, p) => sum + p.agility, 0),
      intelligence: activePlayers.reduce((sum, p) => sum + p.intelligence, 0),
      total: activePlayers.reduce((sum, p) => sum + p.total, 0),
      count: activePlayers.length,
    };
  }, [slots]);

  const changeFormation = (f: Formation) => {
    setFormation(f);
    const newSlots = f.slots.map((s) => {
      const existing = slots.find((sl) => sl.slotId === s.id);
      return {
        slotId: s.id,
        player: existing?.player || null,
        position: s.label,
      };
    });
    const reserves = slots.filter((s) => s.slotId.startsWith("reserve"));
    setSlots([...newSlots, ...reserves]);
  };

  const assignPlayer = (slotId: string, player: Player | null) => {
    setSlots((prev) => {
      const updated = prev.map((s) => {
        if (s.player?.id === player?.id && player)
          return { ...s, player: null };
        if (s.slotId === slotId) return { ...s, player };
        return s;
      });
      return updated;
    });
    setSelectedSlot(null);
    setSearchPlayer("");
  };

  const clearTeam = () => {
    setSlots((prev) => prev.map((s) => ({ ...s, player: null })));
  };

  const exportTeam = () => {
    const data = {
      name: teamName,
      formation: formation.id,
      players: slots
        .filter((s) => s.player)
        .map((s) => ({ slot: s.slotId, playerId: s.player?.id })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${teamName.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importTeam = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.name) setTeamName(data.name);
        if (data.formation) {
          const f = FORMATIONS.find((f) => f.id === data.formation);
          if (f) changeFormation(f);
        }
        if (data.players && Array.isArray(data.players)) {
          const newSlots = slots.map((s) => {
            const match = data.players.find(
              (p: { slot: string }) => p.slot === s.slotId,
            );
            if (match) {
              const player = playersData.find((p) => p.id === match.playerId);
              return { ...s, player: player || null };
            }
            return { ...s, player: null };
          });
          setSlots(newSlots);
        }
      } catch {
        alert(t("teamBuilder.invalidFile"));
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const shareTeam = () => {
    const data = {
      n: teamName,
      f: formation.id,
      p: slots
        .filter((s) => s.player)
        .map((s) => `${s.slotId}:${s.player?.id}`)
        .join(","),
    };
    const encoded = btoa(JSON.stringify(data));
    navigator.clipboard.writeText(
      `${window.location.origin}/teams?t=${encoded}`,
    );
    alert(t("teamBuilder.copied"));
  };

  const filteredPlayers = useMemo(() => {
    const q = searchPlayer.toLowerCase().trim();
    const assignedIds = new Set(
      slots.filter((s) => s.player).map((s) => s.player?.id),
    );
    const isReserve = selectedSlot?.startsWith("reserve");
    return playersData
      .filter((p) => {
        if (!p.name || p.name === "???") return false;
        if (assignedIds.has(p.id)) return false;
        if (!isReserve && selectedPosition && p.position !== selectedPosition)
          return false;
        if (q) {
          const name = jpNames ? getJpName(p.name) : p.name;
          if (
            !name.toLowerCase().includes(q) &&
            !p.name.toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 50);
  }, [searchPlayer, slots, jpNames, selectedPosition, selectedSlot]);

  const displayName = (player: Player) =>
    jpNames ? getJpName(player.name) : player.name;

  return (
    <div className="flex h-full flex-col p-2 sm:p-4">
      <div className="mb-3 rounded-lg border border-card-border bg-card p-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex-1 sm:flex-none">
              <div className="text-xs text-muted">
                {t("teamBuilder.teamName")}
              </div>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-transparent text-base font-bold outline-none sm:text-lg"
              />
            </div>
            <div>
              <div className="text-xs text-muted">
                {t("teamBuilder.formation")}
              </div>
              <Select
                value={formation.id}
                onChange={(id) => {
                  const f = FORMATIONS.find((f) => f.id === id);
                  if (f) changeFormation(f);
                }}
                options={FORMATIONS.map((f) => ({
                  value: f.id,
                  label: f.name,
                }))}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={shareTeam}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent px-2 py-2 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90 sm:flex-none sm:px-3 sm:text-sm"
            >
              <Share2 className="size-4" />
              <span className="hidden sm:inline">{t("teamBuilder.share")}</span>
            </button>
            <button
              onClick={exportTeam}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-2 py-2 text-xs text-muted transition-colors hover:border-accent hover:text-accent sm:flex-none sm:px-3 sm:text-sm"
            >
              <Download className="size-4" />
              <span className="hidden sm:inline">
                {t("teamBuilder.export")}
              </span>
            </button>
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border px-2 py-2 text-xs text-muted transition-colors hover:border-accent hover:text-accent sm:flex-none sm:px-3 sm:text-sm">
              <Upload className="size-4" />
              <span className="hidden sm:inline">
                {t("teamBuilder.import")}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={importTeam}
                className="hidden"
              />
            </label>
            <button
              onClick={clearTeam}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-2 py-2 text-xs text-muted transition-colors hover:border-red-500 hover:text-red-500 sm:flex-none sm:px-3 sm:text-sm"
            >
              <Trash2 className="size-4" />
              <span className="hidden sm:inline">{t("teamBuilder.clear")}</span>
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:gap-4">
        <div className="flex flex-1 flex-col gap-3 lg:min-w-0">
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-lg border-2 border-green-700/50 bg-gradient-to-b from-green-800/40 via-green-600/30 to-green-800/40">
            <div className="absolute inset-0">
              <svg
                viewBox="0 0 120 80"
                className="h-full w-full"
                preserveAspectRatio="xMidYMid slice"
              >
                <rect
                  x="0"
                  y="0"
                  width="120"
                  height="80"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.4"
                  opacity="0.4"
                />
                <line
                  x1="0"
                  y1="40"
                  x2="120"
                  y2="40"
                  stroke="white"
                  strokeWidth="0.3"
                  opacity="0.4"
                />
                <circle
                  cx="60"
                  cy="40"
                  r="9"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.3"
                  opacity="0.4"
                />
                <circle cx="60" cy="40" r="0.8" fill="white" opacity="0.4" />
                <rect
                  x="35"
                  y="0"
                  width="50"
                  height="14"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.3"
                  opacity="0.4"
                />
                <rect
                  x="45"
                  y="0"
                  width="30"
                  height="6"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.3"
                  opacity="0.4"
                />
                <rect
                  x="35"
                  y="66"
                  width="50"
                  height="14"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.3"
                  opacity="0.4"
                />
                <rect
                  x="45"
                  y="74"
                  width="30"
                  height="6"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.3"
                  opacity="0.4"
                />
              </svg>
            </div>
            {formation.slots.map((slot) => {
              const assigned = slots.find((s) => s.slotId === slot.id);
              const player = assigned?.player;
              const isSelected = selectedSlot === slot.id;
              return (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(isSelected ? null : slot.id)}
                  className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center transition-all hover:scale-105 ${isSelected ? "z-10 scale-110" : ""}`}
                  style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
                >
                  {player ? (
                    <div className="relative">
                      <div
                        className="size-9 overflow-hidden rounded-full border-2 shadow-lg sm:size-12"
                        style={{ borderColor: POSITION_COLORS[slot.label] }}
                      >
                        <Image
                          src={player.image}
                          alt={player.name}
                          width={48}
                          height={48}
                          className="size-full object-cover"
                          unoptimized
                        />
                      </div>
                      <div
                        className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded px-1 py-0.5 text-[7px] font-bold text-white shadow sm:text-[9px]"
                        style={{ backgroundColor: POSITION_COLORS[slot.label] }}
                      >
                        {slot.label}
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex size-9 items-center justify-center rounded-full border-2 border-dashed bg-black/30 backdrop-blur-sm sm:size-12"
                      style={{ borderColor: POSITION_COLORS[slot.label] }}
                    >
                      <span
                        className="text-[10px] font-bold sm:text-xs"
                        style={{ color: POSITION_COLORS[slot.label] }}
                      >
                        {slot.label}
                      </span>
                    </div>
                  )}
                  {player && (
                    <div className="mt-0.5 max-w-[50px] truncate rounded bg-black/70 px-1 py-0.5 text-[7px] font-medium text-white sm:max-w-[70px] sm:text-[9px]">
                      {displayName(player).split(" ")[0]}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {teamStats && (
            <div className="rounded-lg border border-card-border bg-card p-2 sm:p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold sm:text-sm">
                  {t("teamBuilder.teamStats")} ({teamStats.count}/11)
                </span>
                <span className="text-base font-bold text-accent sm:text-lg">
                  {teamStats.total} {t("stats.total")}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-7 sm:gap-2">
                {[
                  {
                    label: "KI",
                    full: t("stats.kick"),
                    value: teamStats.kick,
                    color: "#ef4444",
                  },
                  {
                    label: "CO",
                    full: t("stats.control"),
                    value: teamStats.control,
                    color: "#3b82f6",
                  },
                  {
                    label: "TE",
                    full: t("stats.technique"),
                    value: teamStats.technique,
                    color: "#22c55e",
                  },
                  {
                    label: "PR",
                    full: t("stats.pressure"),
                    value: teamStats.pressure,
                    color: "#f59e0b",
                  },
                  {
                    label: "PH",
                    full: t("stats.physical"),
                    value: teamStats.physical,
                    color: "#8b5cf6",
                  },
                  {
                    label: "AG",
                    full: t("stats.agility"),
                    value: teamStats.agility,
                    color: "#ec4899",
                  },
                  {
                    label: "IN",
                    full: t("stats.intelligence"),
                    value: teamStats.intelligence,
                    color: "#06b6d4",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-border bg-background p-1.5 text-center sm:p-2"
                    title={stat.full}
                  >
                    <div
                      className="text-[9px] font-bold sm:text-[10px]"
                      style={{ color: stat.color }}
                    >
                      {stat.label}
                    </div>
                    <div className="font-mono text-xs font-bold sm:text-sm">
                      {stat.value}
                    </div>
                    <div className="hidden text-[9px] text-muted sm:block">
                      {t("teamBuilder.avg")}{" "}
                      {Math.round(stat.value / teamStats.count)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {!teamStats && (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-card/50 p-4 text-center text-muted">
              <div>
                <div className="text-sm">{t("teamBuilder.addPlayers")}</div>
                <div className="text-xs">{t("teamBuilder.clickPosition")}</div>
              </div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 lg:w-64 lg:shrink-0 lg:grid-cols-1">
          <div className="rounded-lg border border-card-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-2 py-1.5 sm:px-3 sm:py-2">
              <span className="text-xs font-semibold sm:text-sm">
                {t("teamBuilder.squad")} ({filledCount}/11)
              </span>
            </div>
            <div className="max-h-[200px] divide-y divide-border overflow-y-auto lg:max-h-[260px]">
              {formation.slots.map((slot, i) => {
                const assigned = slots.find((s) => s.slotId === slot.id);
                const player = assigned?.player;
                return (
                  <div
                    key={slot.id}
                    onClick={() =>
                      setSelectedSlot(selectedSlot === slot.id ? null : slot.id)
                    }
                    className={`flex cursor-pointer items-center gap-1.5 px-2 py-1 text-sm transition-colors hover:bg-accent/5 sm:gap-2 sm:px-3 sm:py-1.5 ${selectedSlot === slot.id ? "bg-accent/10" : ""}`}
                  >
                    <span className="w-3 text-center text-[10px] text-muted">
                      {i + 1}
                    </span>
                    <span
                      className="flex size-4 items-center justify-center rounded text-[7px] font-bold text-white sm:size-[18px] sm:text-[8px]"
                      style={{ backgroundColor: POSITION_COLORS[slot.label] }}
                    >
                      {slot.label}
                    </span>
                    <span className="flex-1 truncate text-[10px] sm:text-xs">
                      {player ? (
                        displayName(player)
                      ) : (
                        <span className="text-muted">
                          {t("teamBuilder.empty")}
                        </span>
                      )}
                    </span>
                    {player && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          assignPlayer(slot.id, null);
                        }}
                        className="text-muted hover:text-red-500"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-lg border border-accent/50 bg-accent/10">
            <div className="flex items-center justify-between border-b border-accent/30 px-2 py-1.5 sm:px-3 sm:py-2">
              <span className="text-xs font-semibold text-accent sm:text-sm">
                {t("teamBuilder.reserve")} ({reserveCount}/{RESERVE_SLOTS})
              </span>
            </div>
            <div className="divide-y divide-accent/20">
              {slots
                .filter((s) => s.slotId.startsWith("reserve"))
                .map((slot, i) => (
                  <div
                    key={slot.slotId}
                    onClick={() =>
                      setSelectedSlot(
                        selectedSlot === slot.slotId ? null : slot.slotId,
                      )
                    }
                    className={`flex cursor-pointer items-center gap-1.5 px-2 py-1 text-sm transition-colors hover:bg-accent/10 sm:gap-2 sm:px-3 sm:py-1.5 ${selectedSlot === slot.slotId ? "bg-accent/20" : ""}`}
                  >
                    <span className="w-3 text-center text-[10px] text-accent">
                      R{i + 1}
                    </span>
                    <span className="flex-1 truncate text-[10px] sm:text-xs">
                      {slot.player ? (
                        displayName(slot.player)
                      ) : (
                        <span className="text-muted">
                          {t("teamBuilder.empty")}
                        </span>
                      )}
                    </span>
                    {slot.player && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          assignPlayer(slot.slotId, null);
                        }}
                        className="text-muted hover:text-red-500"
                      >
                        <X className="size-3" />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
      {selectedSlot && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
          onClick={() => setSelectedSlot(null)}
        >
          <div
            className="max-h-[85vh] w-full rounded-t-2xl border border-card-border bg-card p-3 shadow-2xl sm:max-w-md sm:rounded-lg sm:p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold sm:text-base">
                  {t("teamBuilder.selectPlayer")}
                </h3>
                {selectedPosition && !selectedSlot.startsWith("reserve") && (
                  <div className="flex items-center gap-1.5 text-xs text-muted">
                    <span>{t("teamBuilder.position")}:</span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                      style={{
                        backgroundColor: POSITION_COLORS[selectedPosition],
                      }}
                    >
                      {selectedPosition}
                    </span>
                  </div>
                )}
                {selectedSlot.startsWith("reserve") && (
                  <div className="text-xs text-muted">
                    {t("teamBuilder.reserveSlot")}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="rounded-full p-1 text-muted hover:bg-accent/10 hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <input
              type="text"
              value={searchPlayer}
              onChange={(e) => setSearchPlayer(e.target.value)}
              placeholder={t("teamBuilder.searchPlayers")}
              className="mb-3 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
            <div className="max-h-[50vh] divide-y divide-border overflow-y-auto rounded-lg border border-border sm:max-h-[350px]">
              {filteredPlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => assignPlayer(selectedSlot, player)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors active:bg-accent/20 sm:hover:bg-accent/10"
                >
                  <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-border">
                    <Image
                      src={player.image}
                      alt={player.name}
                      fill
                      sizes="40px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {displayName(player)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="flex size-4 items-center justify-center rounded text-[8px] font-bold text-white"
                        style={{
                          backgroundColor:
                            POSITION_COLORS[player.position as PositionCode] ||
                            "#6b7280",
                        }}
                      >
                        {player.position}
                      </span>
                      <ElementIcon
                        element={player.element}
                        className="size-4"
                      />
                      <span className="text-xs text-muted">
                        {player.total} {t("stats.total").toLowerCase()}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
              {filteredPlayers.length === 0 && (
                <div className="py-8 text-center text-muted">
                  {t("teamBuilder.noPlayersFound")}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
