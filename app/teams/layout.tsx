import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Team Builder | MixiMax",
  description:
    "Build and export your dream team for Inazuma Eleven: Victory Road",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
