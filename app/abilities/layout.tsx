import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Hissatsu | MixiMax",
  description:
    "Browse all Hissatsu techniques with power, TP cost, and effects for Inazuma Eleven: Victory Road",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
