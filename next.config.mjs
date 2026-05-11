/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a self-contained .next/standalone build for the DO droplet
  // (or Docker image). You can run it with `node .next/standalone/server.js`.
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
};

export default nextConfig;
