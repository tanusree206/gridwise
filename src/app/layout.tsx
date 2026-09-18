import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteShell } from "@/components/site-shell";

export const metadata: Metadata = {
  title: "GridWise — AI-Powered Energy Optimization",
  description:
    "GridWise analyzes your energy usage, optimizes electricity consumption, and gives you smart, explainable recommendations to reduce energy costs and waste.",
  applicationName: "GridWise",
  authors: [{ name: "GridWise" }],
  keywords: [
    "energy",
    "AI",
    "optimization",
    "electricity",
    "sustainability",
    "recommendations",
  ],
};

export const viewport: Viewport = {
  themeColor: "#06080f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
