/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
  // sharp & @resvg/resvg-js are native modules — keep them external so Next
  // doesn't try to bundle their .node binaries for the serverless runtime.
  experimental: {
    serverComponentsExternalPackages: ['sharp', '@resvg/resvg-js'],
  },
};

module.exports = nextConfig;
