import type { NextConfig } from 'next';

const BANK_HOST = process.env.NEXT_PUBLIC_BANK_HOST ?? 'http://localhost:3002';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BANK_HOST}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
