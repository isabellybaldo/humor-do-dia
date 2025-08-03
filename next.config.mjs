const repo = 'humor-do-dia';

/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: `/${repo}/`,
  basePath: `/${repo}`,
  output: 'export',
  reactStrictMode: true
};

export default nextConfig;