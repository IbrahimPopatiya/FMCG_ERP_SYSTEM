import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal standalone server bundle for the Docker image,
  // instead of requiring the full node_modules folder at runtime
  output: "standalone",
  // Next.js dev server only trusts "localhost" by default and silently
  // blocks dev-only asset/endpoint requests from other origins - needed so
  // the app works when opened via the laptop's LAN IP (LAN/mobile testing).
  allowedDevOrigins: process.env.DEV_LAN_IP ? [process.env.DEV_LAN_IP] : [],
  // Hides the black Next.js dev-mode badge shown in the corner while running
  // `next dev` - purely a dev overlay, never present in production builds.
  devIndicators: false,
  images: {
    // Lets next/image auto-resize/optimize images from these sources instead
    // of shipping the original full-size file for a thumbnail-sized slot:
    // real product photos (Supabase Storage) and the demo/placeholder
    // fallback images (Wikimedia brand photos, picsum.photos).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/wikipedia/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
