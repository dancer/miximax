import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Fabled | MixiMax",
  description:
    "Browse Fabled (Basara) characters with stats and movesets for Inazuma Eleven: Victory Road",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
