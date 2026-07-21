import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal standalone server bundle for the Docker image,
  // instead of requiring the full node_modules folder at runtime
  output: "standalone",
};

export default nextConfig;
