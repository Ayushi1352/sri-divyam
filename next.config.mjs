/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,

  images: {
    domains: [
      "res.cloudinary.com",
      "shreedivyam.kdscrm.com",
      "placehold.co",
      "shree-divyam.s3.ap-south-1.amazonaws.com",
      "sridhivyam-backend.vercel.app", // <-- add this
    ],
  },

  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: "https://shreedivyam.kdscrm.com/api/:path*",
      },
      {
        source: "/reset-password/:token",
        destination: "/reset-password?token=:token",
      },
    ];
  },
};

export default nextConfig;