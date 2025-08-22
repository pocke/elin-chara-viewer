import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  webpack: (config) => {
    // Enable asset/source for CSV files
    config.module.rules.push({
      test: /\.csv$/,
      type: 'asset/source',
    });
    return config;
  },
};

export default nextConfig;
