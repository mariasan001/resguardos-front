# Resguardos Front

Frontend de **resguardos de cómputo**: alta, firma, PDF, email, catálogos y usuarios.

**Next.js 16** · **React 19** · TypeScript · CSS Modules

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

```env
BACKEND_API_URL=http://localhost:9999
AUTH_SECRET=change-this-secret-before-production
```

`AUTH_SECRET` es obligatorio en producción.

## Scripts

| Comando | Uso |
|---------|-----|
| `npm run dev` | Dev (localhost:3000) |
| `npm run dev:lan` | Dev en red (`:3000`) |
| `npm run build` / `start` | Producción |
| `npm run lint` | ESLint |
| `npm run test` | Vitest |
| `npm run typecheck` | TypeScript |

## Roles

- **admin** — todo (dashboard, listado, usuarios, catálogos)
- **encargado** — alta, preview, detalle por ID y firma

Sesión: cookie `httpOnly` firmada. JWT del backend no se expone al browser.

## Estructura

```text
src/app          rutas + proxies BFF
src/features     flujos de negocio
src/components   shell / UI
src/lib          auth, api, services
docs/            arquitectura
```

## Flujo

Captura → preview/firma → POST + firma → PDF → descarga/email

Detalle: [docs/frontend-architecture.md](./docs/frontend-architecture.md)
