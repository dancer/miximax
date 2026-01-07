"use client";
import { X } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import ElementIcon from "@/components/ElementIcon";
import { getPositionStyle } from "@/lib/constants";
import { getJpName } from "@/lib/names";
import { useSettings } from "@/lib/store";

type ObtainData = {
  playerUniverse?: string[];
  chronicleRoutes?: { route: string; chapters: string[] }[];
  freeMatch?: { game: string; teams: string[] }[];
};
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
  role: string;
  affinity: string;
  moves?: string[];
  shotAT?: number;
  focusAT?: number;
  focusDF?: number;
  scrambleAT?: number;
  scrambleDF?: number;
  wallsDF?: number;
  kp?: number;
  obtain?: ObtainData;
};
export default function PlayerModal({
  player,
  onClose,
}: {
  player: Player;
  onClose: () => void;
}) {
  const t = useTranslations();
  const { jpNames } = useSettings();
  const [rotation, setRotation] = useState(0);
  const startX = useRef(0);
  const posStyle = getPositionStyle(player.position);
  const altPosStyle = player.altPosition
    ? getPositionStyle(player.altPosition)
    : null;
  const displayName = jpNames ? getJpName(player.name) : player.name;
  const hasFullbody = !!player.fullbodyBase;
  const getFullbodyUrl = (r: number) =>
    player.fullbodyBase
      ? `${player.fullbodyBase}_r${r}_fullbody.webp`
      : player.image;
  const handleStart = (x: number) => {
    startX.current = x;
  };
  const handleMove = (x: number) => {
    if (!hasFullbody) return;
    const delta = x - startX.current;
    if (Math.abs(delta) > 40) {
      setRotation((r) => (r + (delta > 0 ? 1 : 7)) % 8);
      startX.current = x;
    }
  };
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasFullbody) setRotation((r) => (r + 7) % 8);
      if (e.key === "ArrowRight" && hasFullbody)
        setRotation((r) => (r + 1) % 8);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, hasFullbody]);
  const hasObtain =
    player.obtain &&
    (player.obtain.playerUniverse ||
      player.obtain.chronicleRoutes ||
      player.obtain.freeMatch);
  if (hasFullbody) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 font-mono"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-5xl overflow-hidden border border-border bg-background"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <span className="text-xs text-muted">#{player.id}</span>
            <button
              onClick={onClose}
              className="text-muted transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex flex-col lg:flex-row max-h-[80vh] overflow-y-auto lg:overflow-hidden">
            <div
              className="relative flex shrink-0 items-center justify-center bg-card lg:w-80"
              onMouseDown={(e) => handleStart(e.clientX)}
              onMouseMove={(e) => e.buttons === 1 && handleMove(e.clientX)}
              onTouchStart={(e) => handleStart(e.touches[0].clientX)}
              onTouchMove={(e) => handleMove(e.touches[0].clientX)}
              style={{ cursor: "ew-resize" }}
            >
              <div className="relative h-64 w-full lg:h-[400px]">
                <Image
                  src={getFullbodyUrl(rotation)}
                  alt={displayName}
                  fill
                  className="object-contain select-none pointer-events-none"
                  draggable={false}
                  unoptimized
                />
              </div>
              <div className="absolute bottom-3 left-0 right-0 text-center text-[10px] uppercase tracking-widest text-muted">
                ← drag →
              </div>
            </div>
            <div className="flex-1 overflow-y-auto border-t lg:border-l lg:border-t-0 border-border lg:max-h-[80vh]">
              <div className="border-b border-border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-muted">
                      {player.game}
                    </div>
                    <h2 className="mt-1 text-2xl font-bold text-foreground">
                      {displayName}
                    </h2>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                      <span>{player.ageGroup}</span>
                      <span className="opacity-50">|</span>
                      <span>{player.year}</span>
                      <span className="opacity-50">|</span>
                      <span>{player.gender}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="flex size-8 items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: posStyle.bg }}
                    >
                      {player.position}
                    </span>
                    {altPosStyle && player.altPosition && (
                      <span
                        className="flex size-8 items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: altPosStyle.bg }}
                      >
                        {player.altPosition}
                      </span>
                    )}
                    <ElementIcon element={player.element} className="size-8" />
                  </div>
                </div>
              </div>
              <StatsSection player={player} />
              <MovesSection moves={player.moves} t={t} />
              <AvailabilitySection
                obtain={player.obtain}
                hasObtain={!!hasObtain}
                t={t}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-4 font-mono"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden border border-border bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
          <span className="text-xs text-muted">#{player.id}</span>
          <button
            onClick={onClose}
            className="text-muted transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto">
          <div className="flex items-center gap-4 border-b border-border p-4">
            <div className="size-20 shrink-0 overflow-hidden border border-border">
              <Image
                src={player.image}
                alt={displayName}
                width={80}
                height={80}
                className="size-full object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-muted">
                {player.game}
              </div>
              <h2 className="mt-1 text-xl font-bold text-foreground truncate">
                {displayName}
              </h2>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                <span>{player.ageGroup}</span>
                <span className="opacity-50">|</span>
                <span>{player.year}</span>
                <span className="opacity-50">|</span>
                <span>{player.gender}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="flex size-8 items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: posStyle.bg }}
              >
                {player.position}
              </span>
              {altPosStyle && player.altPosition && (
                <span
                  className="flex size-8 items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: altPosStyle.bg }}
                >
                  {player.altPosition}
                </span>
              )}
              <ElementIcon element={player.element} className="size-8" />
            </div>
          </div>
          <StatsSection player={player} />
          <MovesSection moves={player.moves} t={t} />
          <AvailabilitySection
            obtain={player.obtain}
            hasObtain={!!hasObtain}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}
function StatsSection({ player }: { player: Player }) {
  return (
    <>
      <div className="grid grid-cols-4 border-b border-border">
        <Stat label="KI" full="Kick" value={player.kick} />
        <Stat label="CO" full="Control" value={player.control} />
        <Stat label="TE" full="Technique" value={player.technique} />
        <Stat label="PR" full="Pressure" value={player.pressure} />
        <Stat label="PH" full="Physical" value={player.physical} />
        <Stat label="AG" full="Agility" value={player.agility} />
        <Stat label="IN" full="Intelligence" value={player.intelligence} />
        <Stat label="TOT" full="Total" value={player.total} accent />
      </div>
      <div className="grid grid-cols-4 border-b border-border">
        <Stat label="SHT" full="Shoot AT" value={player.shotAT || 0} />
        <Stat label="FAT" full="Focus AT" value={player.focusAT || 0} />
        <Stat label="FDF" full="Focus DF" value={player.focusDF || 0} />
        <Stat label="WDF" full="Walls DF" value={player.wallsDF || 0} />
        <Stat label="SAT" full="Scramble AT" value={player.scrambleAT || 0} />
        <Stat label="SDF" full="Scramble DF" value={player.scrambleDF || 0} />
        <Stat label="KP" full="Keeper Power" value={player.kp || 0} />
        <div className="border-r border-border p-3 last:border-r-0" />
      </div>
    </>
  );
}
function MovesSection({
  moves,
  t,
}: {
  moves?: string[];
  t: ReturnType<typeof useTranslations>;
}) {
  if (!moves || moves.length === 0) return null;
  return (
    <div className="border-b border-border p-4">
      <div className="mb-2 text-[10px] uppercase tracking-widest text-muted">
        {t("playerModal.firstMoves")}
      </div>
      <div className="flex flex-wrap gap-2">
        {moves.map((move, i) => (
          <span
            key={i}
            className="border border-border bg-card px-2 py-1 text-xs text-foreground"
          >
            {move}
          </span>
        ))}
      </div>
    </div>
  );
}
function AvailabilitySection({
  obtain,
  hasObtain,
  t,
}: {
  obtain?: ObtainData;
  hasObtain: boolean;
  t: ReturnType<typeof useTranslations>;
}) {
  if (!hasObtain || !obtain) return null;
  return (
    <div className="p-4">
      <div className="mb-3 text-[10px] uppercase tracking-widest text-muted">
        {t("playerModal.availability")}
      </div>
      <div className="space-y-3 text-xs">
        {obtain.playerUniverse && obtain.playerUniverse.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="shrink-0 w-16 text-accent">gacha</span>
            <div className="flex flex-wrap gap-1">
              {obtain.playerUniverse.map((u, i, arr) => (
                <span key={i} className="text-muted">
                  {u}
                  {i < arr.length - 1 && ","}
                </span>
              ))}
            </div>
          </div>
        )}
        {obtain.chronicleRoutes && obtain.chronicleRoutes.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="shrink-0 w-16 text-accent">story</span>
            <div className="flex-1 space-y-1">
              {obtain.chronicleRoutes.map((route, i) => (
                <div key={i} className="flex flex-wrap gap-x-1">
                  <span className="text-foreground/80">{route.route}:</span>
                  {route.chapters.map((ch, j, arr) => (
                    <span key={j} className="text-muted">
                      {ch}
                      {j < arr.length - 1 && ","}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
        {obtain.freeMatch && obtain.freeMatch.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="shrink-0 w-16 text-accent">versus</span>
            <div className="flex-1 space-y-1">
              {obtain.freeMatch.map((match, i) => (
                <div key={i} className="flex flex-wrap gap-x-1">
                  <span className="text-foreground/80">{match.game}:</span>
                  {match.teams.map((team, j, arr) => (
                    <span key={j} className="text-muted">
                      {team}
                      {j < arr.length - 1 && ","}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
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
      className="flex items-center justify-between border-r border-b border-border p-3 last:border-r-0 nth-[4n]:border-r-0 cursor-default"
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
