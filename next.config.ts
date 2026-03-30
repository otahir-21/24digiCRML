import type { NextConfig } from "next";

const backendUrl =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },

  // Proxy all backend API calls through Next.js to avoid Mixed Content
  // errors (Amplify is HTTPS; the EB backend is HTTP).
  // Browser calls /v1/... → Next.js server proxies → backendUrl/v1/...
  async rewrites() {
    return [
      {
        source: "/v1/:path*",
        destination: `${backendUrl}/v1/:path*`,
      },
      {
        source: "/cbyai-subscription/:path*",
        destination: `${backendUrl}/cbyai-subscription/:path*`,
      },
      {
        source: "/cbyai-meals/:path*",
        destination: `${backendUrl}/cbyai-meals/:path*`,
      },
    ];
  },
};

export default nextConfig;
