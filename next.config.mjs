import path from 'path';
import { fileURLToPath } from 'url';
import CaseSensitivePathsPlugin from 'case-sensitive-paths-webpack-plugin';

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
  env: {
    SHIPPO_KEY: process.env.SHIPPO_KEY,
  },
  webpack: (config, { isServer }) => {
      if (isServer) {
          config.externals = [...config.externals, 'firebase-admin', 'buffer'];
          config.plugins.push(new CaseSensitivePathsPlugin());
      }
      config.resolve.alias['@'] = path.resolve(__dirname, 'src');
      return config;
  },
};

export default nextConfig;
