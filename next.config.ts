import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Chromium para los PDF: no se empaqueta con webpack; se incluye tal cual en la función
  // de Vercel (el binario de @sparticuz/chromium vive dentro del paquete).
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  poweredByHeader: false,
};

export default nextConfig;
