import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Self-contained server bundle for the Docker image (AWS ECS / App Runner).
  output: 'standalone',
  // Trace from this folder so the standalone output is flat (server.js at the top) even inside the monorepo.
  outputFileTracingRoot: here,
  poweredByHeader: false,
};
export default nextConfig;
