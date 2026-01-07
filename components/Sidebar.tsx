"use client";
import {
  Cpu,
  Crown,
  Gift,
  Globe,
  Home,
  Languages,
  Menu,
  Moon,
  PanelLeft,
  PanelLeftClose,
  Shield,
  Sparkles,
  Star,
  Sun,
  Swords,
  Target,
  Users,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useSettings } from "@/lib/store";

const LOCALES = [
  { code: "en", label: "English", flag: "GB" },
  { code: "ja", label: "JP", flag: "JP" },
  { code: "de", label: "DE", flag: "DE" },
  { code: "fr", label: "FR", flag: "FR" },
];

export default function Sidebar() {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const {
    jpNames,
    theme,
    sidebarOpen,
    toggleJpNames,
    toggleTheme,
    toggleSidebar,
    setJpNames,
  } = useSettings();
  const [mounted, setMounted] = useState(false);
  const [currentLocale, setCurrentLocale] = useState("en");
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/", label: t("nav.players"), icon: Users },
    { href: "/heroes", label: t("nav.heroes"), icon: Crown },
    { href: "/fabled", label: t("nav.fabled"), icon: Star },
    { href: "/equipment", label: t("nav.equipment"), icon: Shield },
    { href: "/abilities", label: t("nav.hissatsu"), icon: Sparkles },
    { href: "/tactics", label: t("nav.tactics"), icon: Target },
    { href: "/hyper-moves", label: t("nav.hyperMoves"), icon: Zap },
    { href: "/passives", label: t("nav.passives"), icon: Cpu },
    { href: "/drops", label: t("nav.matchDrops"), icon: Gift },
    { href: "/kizuna", label: t("nav.kizuna"), icon: Home },
    { href: "/teams", label: t("nav.teamBuilder"), icon: Swords },
  ];

  useEffect(() => {
    setMounted(true);
    const locale =
      document.cookie
        .split("; ")
        .find((c) => c.startsWith("locale="))
        ?.split("=")[1] || "en";
    setCurrentLocale(locale);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle("dark", theme === "dark");
    }
  }, [theme, mounted]);

  useEffect(() => {
    setMobileOpen(false);
  }, []);

  const changeLocale = (code: string) => {
    document.cookie = `locale=${code};path=/;max-age=31536000`;
    setCurrentLocale(code);
    setShowLangMenu(false);
    if (code === "ja") setJpNames(true);
    router.refresh();
  };

  if (!mounted) return null;

  const currentFlag =
    LOCALES.find((l) => l.code === currentLocale)?.flag || "GB";

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-3 top-3 z-40 flex size-10 items-center justify-center rounded-lg border border-border bg-card text-muted md:hidden"
      >
        <Menu className="size-5" />
      </button>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border bg-card transition-all duration-200 ${sidebarOpen ? "w-44" : "w-14"} ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-3">
          {sidebarOpen && (
            <Link href="/" className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="size-6">
                <g transform="translate(0 -1028.4)">
                  <path
                    d="m7 1028.4-5 12h8l-4 10 14-14h-9l6-8z"
                    fill="#facc15"
                  />
                  <path
                    fill="#eab308"
                    d="m7 1028.4-5 12h3l5-12zm3 12-4 10 3-3 4-7z"
                  />
                  <path
                    fill="#ca8a04"
                    d="m10 1040.4-0.4062 1h2.9062l0.5-1h-3z"
                  />
                </g>
              </svg>
              <span className="font-bold">MixiMax</span>
            </Link>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMobileOpen(false)}
              className="flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-accent/10 hover:text-foreground md:hidden"
            >
              <X className="size-4" />
            </button>
            <button
              onClick={toggleSidebar}
              className="hidden md:flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-accent/10 hover:text-foreground"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="size-4" />
              ) : (
                <PanelLeft className="size-4" />
              )}
            </button>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                title={link.label}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? "bg-accent text-accent-foreground" : "text-muted hover:bg-accent/10 hover:text-foreground"} ${!sidebarOpen && "justify-center px-0"}`}
              >
                <link.icon className="size-4 shrink-0" />
                {sidebarOpen && <span className="truncate">{link.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-0.5 border-t border-border p-2">
          <button
            onClick={toggleJpNames}
            title={t("settings.jpNames")}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${jpNames ? "bg-accent text-accent-foreground" : "text-muted hover:bg-accent/10 hover:text-foreground"} ${!sidebarOpen && "justify-center px-0"}`}
          >
            <Languages className="size-4 shrink-0" />
            {sidebarOpen && (
              <span className="flex-1 truncate text-left">
                {t("settings.jpNames")}
              </span>
            )}
            {sidebarOpen && (
              <span className="text-xs font-medium">
                {jpNames ? "ON" : "OFF"}
              </span>
            )}
          </button>
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              title={t("settings.language")}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-accent/10 hover:text-foreground ${!sidebarOpen && "justify-center px-0"}`}
            >
              <Globe className="size-4 shrink-0" />
              {sidebarOpen && (
                <span className="flex-1 truncate text-left">
                  {t("settings.language")}
                </span>
              )}
              <span className="text-[10px] font-bold">{currentFlag}</span>
            </button>
            {showLangMenu && (
              <div
                className={`absolute bottom-full mb-1 rounded-lg border border-border bg-card p-1 shadow-lg ${sidebarOpen ? "left-0 right-0" : "left-full ml-1"}`}
              >
                {LOCALES.map((locale) => (
                  <button
                    key={locale.code}
                    onClick={() => changeLocale(locale.code)}
                    className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors hover:bg-accent/10 ${currentLocale === locale.code ? "bg-accent/20 text-accent" : "text-muted"}`}
                  >
                    <span className="text-[10px] font-bold">{locale.flag}</span>
                    <span>{locale.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={toggleTheme}
            title={theme === "light" ? t("theme.dark") : t("theme.light")}
            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-accent/10 hover:text-foreground ${!sidebarOpen && "justify-center px-0"}`}
          >
            {theme === "light" ? (
              <Moon className="size-4 shrink-0" />
            ) : (
              <Sun className="size-4 shrink-0" />
            )}
            {sidebarOpen && (
              <span className="truncate">
                {theme === "light" ? t("theme.dark") : t("theme.light")}
              </span>
            )}
          </button>
        </div>
      </aside>
      <div
        className={`hidden md:block transition-all duration-200 ${sidebarOpen ? "ml-44" : "ml-14"}`}
      />
      <div className="md:hidden h-14" />
    </>
  );
}
