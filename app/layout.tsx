import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#4f46e5",
};

export const metadata: Metadata = {
  title: {
    template: "%s | Watermelon CRM",
    default: "Watermelon CRM — Client Work & Invoicing",
  },
  description: "Track client work and generate professional invoices",
  keywords: ["invoicing", "client management", "agency", "billing"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Watermelon CRM",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <ServiceWorkerRegistrar />
        {children}
      </body>
    </html>
  );
}
