import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
