/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["lh3.googleusercontent.com", "storage.googleapis.com"],
  },
  // Allow Anthropic API calls from server only
  serverExternalPackages: [],
};

module.exports = nextConfig;
