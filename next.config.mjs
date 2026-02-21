/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        serverComponentsExternalPackages: ['undici', '@vercel/blob'],
    },
};

export default nextConfig;
