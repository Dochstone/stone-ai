/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  poweredByHeader: false,
  productionBrowserSourceMaps: true,
  // Skip on-demand /_next/image optimizer — sharp is missing on this
  // standalone host (it was returning 500 for /demo/avatar-*.webp). Our
  // images are pre-sized small webp/jpg, nginx serves them directly.
  images: { unoptimized: true },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        os: false,
        path: false,
        https: false,
      };
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        })
      );
    }
    return config;
  },
  async redirects() {
    return [
      { source: "/webchat", destination: "/dashboard/chat", permanent: false },
      { source: "/models/kling-v3", destination: "/models/kling-v2", permanent: true },
      { source: "/models/runway-gen3", destination: "/video", permanent: true },
      { source: "/models/flux-schnell", destination: "/models", permanent: true },
      { source: "/models/stable-diffusion-xl", destination: "/models", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|ico|gif)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/fonts/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), payment=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://mc.yandex.ru https://ajax.googleapis.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://www.google-analytics.com https://mc.yandex.ru wss://mc.yandex.ru https://ajax.googleapis.com https://*.ton.org wss://*.ton.org https://bridge.tonapi.io wss://bridge.tonapi.io https://*.tonapi.io https://connect.tonhubx.com wss://connect.tonhubx.com https://bridge.ton.space wss://bridge.ton.space https://walletbot.me https://tonconnectbridge.mytonwallet.org https://api.coingecko.com https://tonkeeper.com https://raw.githubusercontent.com https://analytics.ton.org https://config.ton.org",
              "media-src 'self' blob:",
              "frame-src 'self' https://t.me",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
