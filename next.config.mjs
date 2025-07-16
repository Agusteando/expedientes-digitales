
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "lh3.googleusercontent.com", // Google profile images
      "cdn.jsdelivr.net",
      "avatars.githubusercontent.com",
      "res.cloudinary.com",
      // add other trusted domains here if needed
    ],
  },
};

export default nextConfig;
