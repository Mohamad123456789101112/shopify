import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.e2b.app"],
  outputFileTracingIncludes: { "/*": ["./drizzle/*.sql"] },
};

export default nextConfig;
