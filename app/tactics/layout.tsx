import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Tactics | MixiMax",
  description:
    "Browse all team tactics with effects for Inazuma Eleven: Victory Road",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
