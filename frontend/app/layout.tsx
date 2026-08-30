import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ServiceWorkerProvider } from "@/lib/providers/service-worker-provider";
import { InstallAppBannerLazy } from "@/components/pwa/InstallAppBannerLazy";
import { AppSplash } from "@/components/shared/AppSplash";
import { BRAND } from "@/lib/branding";
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
  title: BRAND.name,
  description: "Distribution Management System",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: BRAND.name,
  },
};

export const viewport: Viewport = {
  themeColor: BRAND.themeColor,
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
      <head>
        {/* Dev builds change chunk hashes on nearly every restart. A service
            worker + cache left over from a previous session (e.g. an earlier
            `next build && next start`) can keep serving stale, now-404ing
            chunks and blank-screen every reload before our own JS ever gets
            a chance to run. This has to run inline, before any hashed chunk
            is requested, and force one reload so the browser stops being
            controlled by the old worker right away.
            The dev/prod check is baked into the script body (not a JSX
            `{cond && <script>}` branch) so the tag itself always renders
            identically on server and client - only the inlined boolean
            literal can differ, which can't cause a hydration mismatch. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  if (${JSON.stringify(process.env.NODE_ENV !== "production")} !== true) return;
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.getRegistrations().then(function(regs) {
    if (!regs.length) return;
    Promise.all(regs.map(function(r) { return r.unregister(); })).then(function() {
      if ('caches' in window) {
        caches.keys().then(function(keys) {
          keys.forEach(function(k) { caches.delete(k); });
        });
      }
      if (!sessionStorage.getItem('dms-sw-cleared')) {
        sessionStorage.setItem('dms-sw-cleared', '1');
        location.reload();
      }
    });
  });
})();`,
          }}
        />
      </head>
      <body className="flex h-dvh flex-col overflow-hidden" suppressHydrationWarning>
        <AppSplash />
        <ServiceWorkerProvider>
          <InstallAppBannerLazy />
          <QueryProvider>{children}</QueryProvider>
        </ServiceWorkerProvider>
      </body>
    </html>
  );
}
