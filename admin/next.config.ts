import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Payment settings live under Configuración; query strings (`?state=`) pass through.
  redirects() {
    return [
      { source: "/settings", destination: "/settings/payments", permanent: false },
      { source: "/payments", destination: "/settings/payments", permanent: false },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
