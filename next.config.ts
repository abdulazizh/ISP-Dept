import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  async rewrites() {
    return [
      // Serve Expo app from root
      {
        source: '/_expo/:path*',
        destination: '/app/_expo/:path*',
      },
      {
        source: '/assets/:path*',
        destination: '/app/assets/:path*',
      },
    ];
  },
};

export default nextConfig;
