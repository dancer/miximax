import { ImageResponse } from "next/og";
export const runtime = "edge";
export const alt = "MixiMax - Inazuma Eleven Victory Road Companion";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg viewBox="0 0 24 24" width="100" height="100">
            <g transform="translate(0 -1028.4)">
              <path d="m7 1028.4-5 12h8l-4 10 14-14h-9l6-8z" fill="#eab308" />
              <path
                fill="#ca8a04"
                d="m7 1028.4-5 12h3l5-12zm3 12-4 10 3-3 4-7z"
              />
              <path fill="#a16207" d="m10 1040.4-0.4062 1h2.9062l0.5-1h-3z" />
            </g>
          </svg>
          <div
            style={{
              fontSize: 120,
              fontWeight: 900,
              color: "#1c1917",
              letterSpacing: "-4px",
            }}
          >
            MixiMax
          </div>
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#78716c",
            marginTop: 16,
            textAlign: "center",
            maxWidth: 800,
          }}
        >
          Inazuma Eleven Victory Road Companion
        </div>
        <div
          style={{
            display: "flex",
            gap: 32,
            marginTop: 48,
            color: "#1c1917",
            fontSize: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#eab308",
              }}
            />
            4,800+ Players
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#eab308",
              }}
            />
            Full Stats
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: "#eab308",
              }}
            />
            Team Builder
          </div>
        </div>
      </div>
    </div>,
    { ...size },
  );
}
