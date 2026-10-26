import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';
import { execSync } from 'child_process';
import { availableParallelism } from 'os';

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
    ELIN_EA_VERSION: 'EA 23.355',
    ELIN_NIGHTLY_VERSION: 'EA 23.356 Patch 1',
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
    // Next.js defaults to one worker fewer than the CPU count, which is a
    // single worker on the 2 vCPU of the Workers Builds Free plan.
    cpus: availableParallelism(),
    staleTimes: {
      dynamic: 180, // 動的ページを3分間キャッシュ
      static: 180, // 静的ページを3分間キャッシュ
    },
  },
};

// public/_redirects does this on Cloudflare. rewrites() and redirects() in the
// export build would only produce a warning, so they are added for `next dev`
// alone.
const archiveRedirects: NextConfig['redirects'] = async () => [
  {
    source: '/:lang/EA-:ver',
    destination: '/:lang/EA-:ver/charas',
    permanent: true,
  },
];

const archiveRewrites: NextConfig['rewrites'] = async () => [
  {
    source: '/:lang/EA-:ver/charas',
    destination: '/:lang/archive/charas',
  },
  {
    source: '/:lang/EA-:ver/charas/:id',
    destination: '/:lang/archive/charas/detail',
  },
  {
    source: '/:lang/EA-:ver/feats',
    destination: '/:lang/archive/feats',
  },
  {
    source: '/:lang/EA-:ver/feats/:alias',
    destination: '/:lang/archive/feats/detail',
  },
  {
    source: '/:lang/EA-:ver/sources',
    destination: '/:lang/archive/sources',
  },
];

// `next dev` also leaves out `output: 'export'`: with it, the dev server
// rejects an archive URL for not being among the shell's static params.
const resolveConfig = (phase: string): NextConfig =>
  phase === PHASE_DEVELOPMENT_SERVER
    ? {
        ...nextConfig,
        rewrites: archiveRewrites,
        redirects: archiveRedirects,
      }
    : { ...nextConfig, output: 'export' };

export default resolveConfig;
