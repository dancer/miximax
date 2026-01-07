import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Equipment | MixiMax",
  description:
    "Browse all equipment items with stats and effects for Inazuma Eleven: Victory Road",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
