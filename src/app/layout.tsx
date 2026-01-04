import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import "./globals.css";

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
      <body className={`antialiased `}>{children}</body>
    </html>
  );
}
