import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal standalone server bundle for the Docker image,
  // instead of requiring the full node_modules folder at runtime
  output: "standalone",
  // Next.js dev server only trusts "localhost" by default and silently
  // blocks dev-only asset/endpoint requests from other origins - needed so
  // the app works when opened via the laptop's LAN IP (LAN/mobile testing).
  allowedDevOrigins: process.env.DEV_LAN_IP ? [process.env.DEV_LAN_IP] : [],
};

export default nextConfig;
