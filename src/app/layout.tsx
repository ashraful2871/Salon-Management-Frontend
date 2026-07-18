import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Suspense } from "react";
import LoginSuccessToast from "@/components/Shared/LoginSuccessToast";
import LogoutSuccessToast from "@/components/Shared/LogoutSuccessToast";
import { RouteProgressBar } from "@/components/Shared/RouteProgressBar";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
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
    <html lang="en" className={` ${playfairDisplay.className}`}>
      <body className={`antialiased `}>
        {children}
        <Toaster position="bottom-right" richColors />

        <Suspense fallback={null}>
          <LoginSuccessToast />
          <LogoutSuccessToast />
          <RouteProgressBar />
        </Suspense>
      </body>
    </html>
  );
}
