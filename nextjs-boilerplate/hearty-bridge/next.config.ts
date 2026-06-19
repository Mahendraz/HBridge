import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  turbopack: {},

  // Prevent webpack from bundling native-binary packages —
  // sharp (image), fluent-ffmpeg (video), and ffmpeg-static must run as-is in Node.js
  serverExternalPackages: ['sharp', 'fluent-ffmpeg', 'ffmpeg-static'],

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
