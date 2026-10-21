import type { NextConfig } from "next";

// Staff sign in at a private address that is served by the (hidden) /admin/login page; see library/adminPaths.ts.
const adminLoginPath = process.env.NEXT_PUBLIC_ADMIN_LOGIN_PATH ?? "/staff-access";

const nextConfig: NextConfig = {
  async rewrites() {
    return { beforeFiles: [{ source: adminLoginPath, destination: "/admin/login" }], afterFiles: [], fallback: [] };
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
};

export default nextConfig;
