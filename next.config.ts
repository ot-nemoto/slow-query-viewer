import type { NextConfig } from "next";

const isStatic = process.env.BUILD_MODE === 'static';

const nextConfig: NextConfig = {
  ...(isStatic && {
    output: 'export',
    trailingSlash: true,
    basePath: '/slow-query-viewer',
    assetPrefix: '/slow-query-viewer',
    images: {
      unoptimized: true
    }
  })
};

export default nextConfig;
