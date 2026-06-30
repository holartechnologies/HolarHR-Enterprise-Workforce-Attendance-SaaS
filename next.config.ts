import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs", "ioredis", "bullmq", "@prisma/adapter-better-sqlite3"],
};

export default nextConfig;
