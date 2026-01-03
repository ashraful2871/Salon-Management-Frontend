import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stylish Salon - Beauty Services Management",
  description: "Find and book the best salons in your area. Manage your salon appointments, customers, and services with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
