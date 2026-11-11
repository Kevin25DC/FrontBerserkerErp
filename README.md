# Berserker ERP — Web

Front en **Next.js 15 (App Router) + TypeScript**, desplegable en Vercel. Consume la API de [Kevin25DC/BerserkerERP](https://github.com/Kevin25DC/BerserkerERP) (carpeta `api/`).

## Arquitectura

- **Sesión segura**: `/api/auth/login` guarda el JWT en una cookie `httpOnly` (JavaScript no puede leerla).
  El navegador llama a `/api/backend/*` (mismo origen, sin CORS) y el servidor de Next reenvía a la API con el token.
- **Middleware**: sin sesión → `/login?next=…`; tras entrar vuelve a la página pedida.
- **TanStack Query**: caché de datos; volver a una pantalla es inmediato y se refresca en segundo plano.
- **Búsquedas y paginación en el servidor** (con espera de 300 ms al escribir).

## PDF — mismas plantillas del sistema actual

`src/components/doc-templates/` contiene las plantillas portadas **literalmente** de VisualPos
(CSS copiado tal cual, mismo marcado): factura de contado, factura a crédito con plan de pagos,
comprobante de anulación, recibo de cuota, anulación de pago y cotización.
Verificado: la factura de contado y la de crédito salen **idénticas píxel a píxel** a las del sistema actual.

- `GET /api/pdf/{invoice|quote}/{id}` — descarga desde el navegador (con la sesión).
- `GET /api/pdf/{quota-receipt|quota-reversal}/{quotaId}?invoice=ID&amount=X` — recibos.
- `POST /api/pdf/{kind}` + `Authorization: Bearer PDF_SERVICE_TOKEN` — servicio para la API
  (adjuntos de correo/WhatsApp); solo renderiza los datos que recibe.

Chromium: en Vercel `@sparticuz/chromium`; en local, el Chrome instalado (`CHROME_PATH`).

## Correr en local

```powershell
npm install
copy .env.example .env.local     # API_URL apuntando a la API
npm run dev                      # http://127.0.0.1:3000
```

## Desplegar en Vercel

1. *New Project* → mismo repo → **Root Directory: `web`** (framework Next.js, se detecta solo).
2. Environment Variables: `API_URL=https://<tu-api>.vercel.app/api/v1`, `PDF_SERVICE_TOKEN=<mismo de la API>`.
3. En la API: `CORS_ORIGINS` ya no es necesario para el navegador (todo pasa por el proxy), y
   `PDF_SERVICE_URL=https://<tu-web>.vercel.app/api/pdf` para los adjuntos.
