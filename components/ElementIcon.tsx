import Image from "next/image";

const ELEMENTS = ["Fire", "Wind", "Mountain", "Forest", "Void"] as const;

export default function ElementIcon({
  element,
  className,
}: {
  element: string;
  className?: string;
}) {
  if (!ELEMENTS.includes(element as (typeof ELEMENTS)[number])) {
    return (
      <span
        className={`flex size-6 items-center justify-center rounded-[3px] bg-neutral-400 text-[10px] font-bold text-white ${className || ""}`}
        title={element || "Unknown"}
      >
        ?
      </span>
    );
  }

  return (
    <Image
      src={`/elements/${element.toLowerCase()}.webp`}
      alt={element}
      width={20}
      height={20}
      className={`size-6 ${className || ""}`}
      title={element}
    />
  );
}

export function getElementBg(element: string): string {
  const colors: Record<string, string> = {
    Fire: "#ef4444",
    Wind: "#2563eb",
    Mountain: "#f59e0b",
    Forest: "#22c55e",
    Void: "#8b5cf6",
  };
  return colors[element] || "#6b7280";
}
