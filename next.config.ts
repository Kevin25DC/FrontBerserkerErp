import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Chromium para los PDF: no se empaqueta con webpack; se incluye tal cual en la función
  // de Vercel (el binario de @sparticuz/chromium vive dentro del paquete).
  serverExternalPackages: ['@sparticuz/chromium', 'puppeteer-core'],
  // El binario de Chromium se lee con fs en runtime; hay que forzar su inclusión
  // en las funciones de PDF (si no, Vercel no lo sube).
  outputFileTracingIncludes: {
    '/api/pdf/**': ['./node_modules/@sparticuz/chromium/bin/**'],
  },
  poweredByHeader: false,
};

export default nextConfig;
