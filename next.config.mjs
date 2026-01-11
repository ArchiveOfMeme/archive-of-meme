/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // OpenSea CDN (primary - fast, optimized) - wildcard for all subdomains
      {
        protocol: 'https',
        hostname: '*.seadn.io',
      },
      {
        protocol: 'https',
        hostname: 'openseauserdata.com',
      },
      // Cloudflare IPFS Gateway (fast, cached)
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
      },
      {
        protocol: 'https',
        hostname: 'cf-ipfs.com',
      },
      // Fallback IPFS gateways
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
      {
        protocol: 'https',
        hostname: '*.ipfs.dweb.link',
      },
      // Other sources
      {
        protocol: 'https',
        hostname: 'arweave.net',
      },
      {
        protocol: 'https',
        hostname: 'nft-cdn.alchemy.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    // Image optimization settings
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days cache
  },
};

export default nextConfig;
