// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  typescript: {
    ignoreBuildErrors: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
    // ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: process.env.NEXT_PUBLIC_IGNORE_BUILD_ERROR === "true",
    // ignoreDuringBuilds: true,
  },
  webpack: config => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  env: {
    WEBSOCKET_URL: process.env.WEBSOCKET_URL ?? "ws://localhost:3003",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  }
};

module.exports = nextConfig;
