import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.HEATMAPS_NATIVE_EXPORT === '1' ? {
    output: 'export' as const,
    trailingSlash: true,
  } : {}),
  ...(process.env.HEATMAPS_NATIVE_EXPORT === '1' ? {} : {
    cacheComponents: true,
    partialPrefetching: true,
  }),
  ...(process.env.HEATMAPS_NATIVE_EXPORT === '1' ? {} : { async headers() {
    return [
      {
        // The dashboard's state lives in the browser. Do not allow a browser
        // to reuse an old HTML shell after an app update; hashed JS/CSS files
        // remain safely cacheable by Next.js.
        source: '/',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
    ];
  } }),
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
