import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Passives | MixiMax",
  description:
    "Browse all passive abilities for players and coordinators in Inazuma Eleven: Victory Road",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
