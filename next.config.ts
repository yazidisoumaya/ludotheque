import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exclut les packages natifs du bundle Vercel — chargés via require() côté serveur uniquement
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
};

export default nextConfig;
