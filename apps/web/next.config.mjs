/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // ESLint не сконфигурирован в MVP — не валим сборку из-за него. Типы проверяются.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
