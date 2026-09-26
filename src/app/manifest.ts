import type { MetadataRoute } from "next";
import { BRAND } from "@/content/research";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND.name,
    short_name: BRAND.name,
    description: BRAND.metaDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#05080b",
    theme_color: "#05080b",
    icons: [
      { src: "/brand/drishya-icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/drishya-icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/drishya-icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/brand/drishya-icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
