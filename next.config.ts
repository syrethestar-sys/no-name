import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Thumbnails are short-lived signed URLs from Supabase Storage. They change on
    // every request, so they're rendered `unoptimized` instead of going through the optimizer.
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/**' },
      { protocol: 'https', hostname: 'img.clerk.com' }, // member avatars on /admin/members
    ],
  },
};

export default nextConfig;
