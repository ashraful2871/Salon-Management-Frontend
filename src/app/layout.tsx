import type { Metadata } from "next";
import { Inter, Teko } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import LoginSuccessToast from "@/components/Shared/LoginSuccessToast";
import LogoutSuccessToast from "@/components/Shared/LogoutSuccessToast";
import { RouteProgressBar } from "@/components/Shared/RouteProgressBar";
import { AppToaster } from "@/components/Shared/AppToaster";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const teko = Teko({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Stylish Salon - Beauty Services Management",
  description:
    "Find and book the best salons in your area. Manage your salon appointments, customers, and services with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${teko.variable}`}>
      <body className={`antialiased font-body `}>
        {children}
        <AppToaster />

        <Suspense fallback={null}>
          <LoginSuccessToast />
          <LogoutSuccessToast />
          <RouteProgressBar />
        </Suspense>
      </body>
    </html>
  );
}
