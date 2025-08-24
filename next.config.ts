import type { NextConfig } from 'next';
import { execSync } from 'child_process';

const getGitInfo = () => {
  try {
    const commitDate = execSync('git log -1 --format="%ci"', {
      encoding: 'utf8',
    }).trim();
    const remoteUrl = execSync('git config --get remote.origin.url', {
      encoding: 'utf8',
    }).trim();

    let repositoryUrl = remoteUrl;
    if (repositoryUrl.startsWith('git@github.com:')) {
      repositoryUrl = repositoryUrl
        .replace('git@github.com:', 'https://github.com/')
        .replace('.git', '');
    } else if (repositoryUrl.endsWith('.git')) {
      repositoryUrl = repositoryUrl.replace('.git', '');
    }

    return {
      lastCommitDate: new Date(commitDate).toISOString(),
      repositoryUrl,
    };
  } catch (error) {
    console.warn('Failed to get git info:', error);
    return {
      lastCommitDate: new Date().toISOString(),
      repositoryUrl: 'https://github.com/pocke/elin-chara-viewer',
    };
  }
};

const gitInfo = getGitInfo();

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  env: {
    GIT_LAST_COMMIT_DATE: gitInfo.lastCommitDate,
    GIT_REPOSITORY_URL: gitInfo.repositoryUrl,
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
