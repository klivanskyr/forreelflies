const nextConfig = {
  webpack: (config, { isServer }) => {
      if (isServer) {
          config.externals = [...config.externals, 'firebase-admin', 'buffer'];
      }
      return config;
  },
};

export default nextConfig;
