import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Hyper Moves | MixiMax",
  description:
    "Browse all Hyper Moves with power and effects for Inazuma Eleven: Victory Road",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
