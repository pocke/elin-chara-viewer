import type { NextConfig } from 'next';
import { execSync } from 'child_process';

const getGitInfo = () => {
  try {
    const commitDate = execSync('git log -1 --format="%ci"', {
      encoding: 'utf8',
    }).trim();

    return {
      lastCommitDate: new Date(commitDate).toISOString(),
    };
  } catch (error) {
    console.warn('Failed to get git info:', error);
    return {
      lastCommitDate: new Date().toISOString(),
    };
  }
};

const gitInfo = getGitInfo();

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  env: {
    GIT_LAST_COMMIT_DATE: gitInfo.lastCommitDate,
  },
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
