const repo = 'humor-do-dia';
const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: isProd ? `/${repo}/` : '',
  basePath: isProd ? `/${repo}` : '',
  output: isProd ? 'export' : undefined,
  reactStrictMode: true
};

export default nextConfig;