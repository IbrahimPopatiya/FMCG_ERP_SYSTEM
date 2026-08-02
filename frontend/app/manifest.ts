import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Zaid Traders - Distribution Management System",
    short_name: "ZT",
    description: "Distribution Management System",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f7fa",
    theme_color: "#192bc2",
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
