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
      },
      {
        protocol: 'https',
        hostname: '**',  // Allow all domains temporarily for development
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
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};

export default nextConfig;
