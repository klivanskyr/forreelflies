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
      return config;
  },
};

export default nextConfig;
