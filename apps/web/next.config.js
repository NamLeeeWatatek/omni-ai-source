/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@wataomi/ui', '@wataomi/types'],
    images: {
        domains: ['localhost'],
    },
}

module.exports = nextConfig
