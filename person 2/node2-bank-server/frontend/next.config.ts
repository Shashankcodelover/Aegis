import type { NextConfig } from 'next';
import path from 'path';

const BANK_HOST = process.env.NEXT_PUBLIC_BANK_HOST ?? 'http://localhost:3002';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  allowedDevOrigins: ['10.60.226.69'],
  turbopack: {},
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BANK_HOST}/api/:path*` },
      { source: '/admin/:path*', destination: `${BANK_HOST}/admin/:path*` },
    ];
  },
};

export default nextConfig;
