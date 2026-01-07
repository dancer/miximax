import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Kizuna Town | MixiMax",
  description:
    "Browse all Kizuna Town building items for Inazuma Eleven: Victory Road",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
