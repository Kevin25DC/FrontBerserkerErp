import 'server-only';

/** Configuración del lado del servidor (nunca llega al navegador). */
export const API_URL = (process.env.API_URL || 'http://127.0.0.1:8100/api/v1').replace(/\/$/, '');
export const SESSION_COOKIE = 'berserker_session';
export const IS_PROD = process.env.NODE_ENV === 'production';
