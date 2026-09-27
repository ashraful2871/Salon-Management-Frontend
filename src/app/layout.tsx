import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import LoginSuccessToast from "@/components/Shared/LoginSuccessToast";
import LogoutSuccessToast from "@/components/Shared/LogoutSuccessToast";
import { NavProgress } from "@/components/Shared/NavProgress";
import { AppToaster } from "@/components/Shared/AppToaster";

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
  title: "SalonKhuji - Beauty Services Management",
  description:
    "Find and book the best salons in your area. Manage your salon appointments, customers, and services with ease.",
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
