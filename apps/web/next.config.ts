import type { NextConfig } from "next"

function getBackendURL() {
  const configuredURL = process.env.BACKEND_URL?.trim()
  if (configuredURL) return configuredURL.replace(/\/$/, "")

  if (process.env.NODE_ENV === "production") {
    throw new Error("BACKEND_URL is required for production builds")
  }

  return "http://localhost:8080"
}

const backendURL = getBackendURL()

const nextConfig: NextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@workspace/ui"],
  async redirects() {
    return [
      {
        source: "/",
        destination: "/shell",
        permanent: false,
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendURL}/api/:path*`,
      },
    ]
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), geolocation=(), microphone=()",
          },
        ],
      },
    ]
  },
}

export default nextConfig
