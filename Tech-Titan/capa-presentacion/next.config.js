/** @type {import('next').NextConfig} */

// Resolución de URL del backend:
// NEXT_PUBLIC_MEDUSA_BACKEND_URL > NEXT_PUBLIC_API_URL > localhost:9000
const resolveBackendUrl = () =>
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_URL            ??
  "http://localhost:9000";

const nextConfig = {
  // ── API proxy → backend (evita CORS en dev y producción) ─────────────────
  async rewrites() {
    const apiUrl = resolveBackendUrl();
    return [
      {
        source:      "/api/backend/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },

  // ── Imágenes remotas permitidas ───────────────────────────────────────────
  // Necesario para avatares de GitHub/Google OAuth y CDN externo
  images: {
    remotePatterns: [
      // GitHub avatars (OAuth)
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      // Google avatars (OAuth)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      // Cloudinary / S3 (si se añade almacenamiento de imágenes)
      { protocol: "https", hostname: "*.cloudinary.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      // MedusaJS media (Railway / producción)
      { protocol: "https", hostname: "*.railway.app" },
    ],
  },

  // ── Headers de seguridad ──────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "X-Content-Type-Options",     value: "nosniff" },
          { key: "Referrer-Policy",            value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
