import 'server-only';

/** Configuración del lado del servidor (nunca llega al navegador). */
const DEFAULT_API_URL = process.env.VERCEL
  ? 'https://api.celuproco.com.co/api/v1'
  : 'http://127.0.0.1:8100/api/v1';
export const API_URL = (process.env.API_URL || DEFAULT_API_URL).replace(/\/$/, '');
export const SESSION_COOKIE = 'berserker_session';
export const IS_PROD = process.env.NODE_ENV === 'production';
