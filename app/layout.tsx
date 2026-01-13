import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import MainContent from "@/components/MainContent";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MixiMax",
  description:
    "Browse 4,800+ players, compare stats, and build your dream team for Inazuma Eleven: Victory Road",
  metadataBase: new URL("https://mixim.ax"),
  other: { google: "notranslate" },
  openGraph: {
    title: "MixiMax",
    description:
      "Browse 4,800+ players, compare stats, and build your dream team for Inazuma Eleven: Victory Road",
    url: "https://mixim.ax",
    siteName: "MixiMax",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MixiMax",
    description:
      "Browse 4,800+ players, compare stats, and build your dream team for Inazuma Eleven: Victory Road",
  },
  appleWebApp: {
    capable: true,
    title: "MixiMax",
    statusBarStyle: "default",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} translate="no" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased notranslate`}
      >
        <NextIntlClientProvider messages={messages}>
          <Sidebar />
          <MainContent>{children}</MainContent>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
