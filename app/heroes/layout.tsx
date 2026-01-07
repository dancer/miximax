import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Heroes | MixiMax",
  description:
    "Browse Hero characters with stats and movesets for Inazuma Eleven: Victory Road",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
