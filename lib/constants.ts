export const ELEMENTS = ["Fire", "Wind", "Mountain", "Forest", "Void"] as const;
export const POSITIONS = ["GK", "DF", "MF", "FW"] as const;

export const POSITION_STYLES: Record<string, { bg: string }> = {
  GK: { bg: "#f59e0b" },
  DF: { bg: "#3b82f6" },
  MF: { bg: "#22c55e" },
  FW: { bg: "#ef4444" },
};

export const AFFINITY_STYLES: Record<string, { bg: string; label: string }> = {
  Justice: { bg: "#3b82f6", label: "JUSTICE" },
  Bond: { bg: "#22c55e", label: "BOND" },
  Counter: { bg: "#f59e0b", label: "COUNTER" },
  Tension: { bg: "#ef4444", label: "TENSION" },
  Breach: { bg: "#ec4899", label: "BREACH" },
  "Rough Play": { bg: "#ef4444", label: "ROUGH PLAY" },
  Unknown: { bg: "#6b7280", label: "?" },
};

export function getPositionStyle(position: string) {
  return POSITION_STYLES[position] || { bg: "#6b7280" };
}

export function getAffinityStyle(affinity: string) {
  return AFFINITY_STYLES[affinity] || AFFINITY_STYLES.Unknown;
}
