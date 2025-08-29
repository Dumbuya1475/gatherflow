import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
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
        hostname: 'uniguide-b996d.web.app',
        port: '',
        pathname: '/**',
      },
    ],
  },
   webpack: (
    config,
    { isServer },
  ) => {
    if (isServer) {
        config.externals.push({
            'handlebars': 'handlebars',
            'dotprompt': 'dotprompt'
        });
    }
    return config
  },
};

export default nextConfig;
