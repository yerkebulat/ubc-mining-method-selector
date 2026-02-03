/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/ubc-mining-method-selector' : '',
  trailingSlash: true,
}

module.exports = nextConfig
