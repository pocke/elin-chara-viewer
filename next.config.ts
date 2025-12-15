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
  env: {
    GIT_LAST_COMMIT_DATE: gitInfo.lastCommitDate,
    ELIN_EA_VERSION: 'EA 23.247 Patch 1',
    ELIN_NIGHTLY_VERSION: 'EA 23.246 Patch 1',
  },
  turbopack: {
    rules: {
      '*.csv': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  },
};

export default nextConfig;
