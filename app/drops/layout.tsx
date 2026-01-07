import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Match Drops | MixiMax",
  description:
    "Browse all match drop rewards and locations for Inazuma Eleven: Victory Road",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
