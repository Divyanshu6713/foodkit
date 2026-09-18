import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The site has no server-side features, so `next build` emits a plain
  // static site in ./out that any static host can serve.
  output: "export",
};

export default nextConfig;
