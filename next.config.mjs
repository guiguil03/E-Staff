// En-têtes de sécurité appliqués à toutes les pages (audit du 2026-09-28).
// Pas de Permissions-Policy : elle limiterait la caméra/le micro délégués à
// l'iframe Daily des classes virtuelles.
const securityHeaders = [
  // Le site ne peut pas être affiché dans une iframe d'un autre site
  // (clickjacking sur la connexion, les paiements...).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Les liens contenant un jeton (réinitialisation de mot de passe,
  // contrats) ne fuient pas vers les sites externes via Referer.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
