"use client";
import { useEffect, useState } from "react";
import { useSettings } from "@/lib/store";

export default function MainContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted)
    return (
      <main className="pt-14 md:pt-0 md:ml-44 min-h-screen bg-background">
        {children}
      </main>
    );

  return (
    <main
      className={`min-h-screen bg-background transition-all duration-200 pt-14 md:pt-0 ${sidebarOpen ? "md:ml-44" : "md:ml-14"}`}
    >
      {children}
    </main>
  );
}
