const repo = 'humor-do-dia';
const isProd = process.env.NODE_ENV === 'production';

// GitHub Pages serves this under /humor-do-dia, so it needs a basePath.
// The VPS (humor.isoca.space) serves it at the root, so the Dockerfile sets
// NO_BASE_PATH=1 to drop the prefix. Default keeps the GitHub Pages behaviour.
const useBasePath = isProd && process.env.NO_BASE_PATH !== '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: useBasePath ? `/${repo}/` : '',
  basePath: useBasePath ? `/${repo}` : '',
  output: isProd ? 'export' : undefined,
  images: { unoptimized: true },
  reactStrictMode: true
};

export default nextConfig;
