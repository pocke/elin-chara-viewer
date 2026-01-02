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
    ELIN_EA_VERSION: 'EA 23.252 Patch 2',
    ELIN_NIGHTLY_VERSION: 'EA 23.254',
  },
  turbopack: {
    rules: {
      '*.csv': {
        loaders: ['raw-loader'],
        as: '*.js',
      },
    },
  },
  experimental: {
    staleTimes: {
      dynamic: 180, // 動的ページを3分間キャッシュ
      static: 180, // 静的ページを3分間キャッシュ
    },
  },
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600, stale-while-revalidate=86400',
        },
      ],
    },
  ],
};

export default nextConfig;
