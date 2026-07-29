import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ServiceWorkerProvider } from "@/lib/providers/service-worker-provider";
import { InstallAppBanner } from "@/components/pwa/InstallAppBanner";
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
  title: "DMS",
  description: "Distribution Management System",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DMS",
  },
};

export const viewport: Viewport = {
  themeColor: "#192bc2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex h-dvh flex-col overflow-hidden">
        <ServiceWorkerProvider>
          <InstallAppBanner />
          <QueryProvider>{children}</QueryProvider>
        </ServiceWorkerProvider>
      </body>
    </html>
  );
}
