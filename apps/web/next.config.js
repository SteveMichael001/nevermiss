/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['stripe'],
  },
  images: {
    domains: [],
  },
}

module.exports = nextConfig
