import type { NextConfig } from "next";

const backend = process.env.BACKEND_URL || "http://127.0.0.1:8001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${backend}/api/v1/:path*` },
      // Evidence photos and profile pictures are served by the backend.
      { source: "/uploads/:path*", destination: `${backend}/uploads/:path*` },
      // Used by the sidebar to show whether the API is reachable.
      { source: "/backend-health", destination: `${backend}/health` },
    ];
  },
  async headers() {
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] }];
  },
};

export default nextConfig;
