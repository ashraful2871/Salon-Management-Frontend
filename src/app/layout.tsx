import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import LoginSuccessToast from "@/components/Shared/LoginSuccessToast";
import LogoutSuccessToast from "@/components/Shared/LogoutSuccessToast";
import { NavProgress } from "@/components/Shared/NavProgress";
import { AppToaster } from "@/components/Shared/AppToaster";
import { SITE } from "@/lib/site";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "SalonKhuji: book trusted salons near you",
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  // Add images: [{ url: "/og.jpg", width: 1200, height: 630 }] once public/og.jpg exists.
  openGraph: { siteName: SITE.name, type: "website", locale: "en_BD" },
  twitter: { card: "summary_large_image" },
  icons: {
    icon: "/favicon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#fdfcf9",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body className="antialiased font-body bg-background text-foreground">
        {children}
        <AppToaster />

        <Suspense fallback={null}>
          <LoginSuccessToast />
          <LogoutSuccessToast />
          <NavProgress />
        </Suspense>
      </body>
    </html>
  );
}
