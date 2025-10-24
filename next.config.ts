import type {NextConfig} from 'next';

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  swcMinify: false,
  exclude: [
    /^\/icon0\.svg$/,
    /^\/icon1\.png$/,
  ],
});

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bsmnnvxqvqmvokqtgsrd.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'gxobiiqbwbhrjsynzaos.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'gxandbggnaxkhhhxnabd.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'jhqvuwwqevhxotlhbfnl.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Fix the serverActions configuration
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(mp4|webm)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/videos/[name].[hash][ext]',
      },
    });

    return config;
  },
};

export default withPWA(nextConfig);