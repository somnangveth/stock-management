//  @type {import('next').NextConfig} 
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xhfsyrdqmaxuhqbnhttj.supabase.co',
        pathname: '**',
      },
    ],
  },
  experimental: {
  serverActions: {},
}
};

module.exports = nextConfig;
