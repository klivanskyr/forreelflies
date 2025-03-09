import path from 'path';

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      }
    ]
  },
  webpack: (config, { isServer }) => {
      if (isServer) {
          config.externals = [...config.externals, 'firebase-admin', 'buffer'];
      }
      config.resolve.alias['@'] = path.resolve(__dirname, 'src');
      return config;
  },
};

export default nextConfig;
