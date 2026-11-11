import 'server-only';

import type { Browser } from 'puppeteer-core';

/**
 * HTML → PDF con Chromium.
 * - Vercel/Linux: @sparticuz/chromium (binario empaquetado para serverless).
 * - Local (Windows/Mac): Chrome instalado (CHROME_PATH o ruta estándar).
 * El navegador se reutiliza entre peticiones mientras la instancia siga viva.
 */
let browserPromise: Promise<Browser> | null = null;

const LOCAL_CHROME = process.env.CHROME_PATH || (process.platform === 'win32'
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : process.platform === 'darwin' ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' : '/usr/bin/google-chrome');

async function launch(): Promise<Browser> {
  const puppeteer = (await import('puppeteer-core')).default;
  if (process.env.VERCEL || process.env.AWS_EXECUTION_ENV) {
    const chromium = (await import('@sparticuz/chromium')).default;
    return puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true });
  }
  return puppeteer.launch({ executablePath: LOCAL_CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu'] });
}

function getBrowser() {
  if (!browserPromise) {
    browserPromise = launch().then((b) => {
      b.on('disconnected', () => { browserPromise = null; });
      return b;
    }).catch((e) => { browserPromise = null; throw e; });
  }
  return browserPromise;
}

export async function htmlToPdf(html: string): Promise<Uint8Array> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'load', timeout: 20_000 });
    // Mismas opciones que pdfgen/generate_pdf.js del sistema actual
    return await page.pdf({ format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' } });
  } finally {
    await page.close().catch(() => undefined);
  }
}

export function htmlPage(body: string, css: string, title: string) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${title}</title><style>${css}</style></head><body>${body}</body></html>`;
}
