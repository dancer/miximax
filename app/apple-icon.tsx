import { ImageResponse } from "next/og";
export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        borderRadius: 40,
      }}
    >
      <svg viewBox="0 0 24 24" width="120" height="120">
        <g transform="translate(0 -1028.4)">
          <path d="m7 1028.4-5 12h8l-4 10 14-14h-9l6-8z" fill="#eab308" />
          <path fill="#ca8a04" d="m7 1028.4-5 12h3l5-12zm3 12-4 10 3-3 4-7z" />
          <path fill="#a16207" d="m10 1040.4-0.4062 1h2.9062l0.5-1h-3z" />
        </g>
      </svg>
    </div>,
    { ...size },
  );
}
