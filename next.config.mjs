/** @type {import('next').NextConfig} */
const nextConfig = {
  // imagen de produccion minima (.next/standalone + node server.js)
  output: "standalone",
  // mysql2 es solo de servidor; no empaquetarlo para el cliente
  serverExternalPackages: ["mysql2"],
  devIndicators: { position: "bottom-right" },
  // el browser pide /favicon.ico -> servir el icono SVG
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon.svg" }];
  },
};

export default nextConfig;
