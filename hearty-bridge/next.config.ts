import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // Turbopack is used by `next dev`; production builds use webpack
  // (`next build --webpack`, see package.json) because Turbopack runs PostCSS
  // in a separate Node.js worker pool that gets killed on memory-limited hosts
  // like Hostinger, crashing the build while processing app/globals.css.
  turbopack: {},

  experimental: {
    // Lowers peak memory during `next build --webpack` at a small compile-time cost.
    webpackMemoryOptimizations: true,
  },

  // Prevent the bundler from bundling native-binary packages —
  // sharp (image) and ffmpeg-static (video) must run as-is in Node.js;
  // heic-convert loads a WASM HEIC decoder at runtime
  serverExternalPackages: ['sharp', 'ffmpeg-static', 'heic-convert'],

  images: {
    remotePatterns: [
      // Cloudflare R2 signed URLs
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
        pathname: '/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
