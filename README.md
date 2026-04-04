# Las Girls+ Web Platform

Base de producción para:

- Sitio público (home one-page + páginas auxiliares)
- Admin privado con Firebase Auth (sin registro abierto)
- CRM interno de leads/clientes/notas
- Blog con markdown + likes
- Media manager con Firebase Storage (1MB máx)
- Stats internas preparadas para datos reales

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- GSAP + ScrollTrigger
- Firebase Auth / Firestore / Storage
- React Hook Form + Zod

## Estructura principal

- `src/app/(public)`: home + about + team + blog + contact
- `src/app/admin`: panel privado (dashboard, leads, clients, blog, media, users, invitations, stats)
- `src/app/invite/[token]`: aceptación de invitación admin
- `src/app/api`: endpoints de contacto, likes, invitaciones, auth session y operaciones admin
- `src/content`: copy editable y semillas de contenido
- `src/services`: lógica de negocio desacoplada
- `src/lib/firebase`: clientes Firebase client/admin
- `src/lib/validations`: esquemas Zod
- `src/types`: tipos de dominio

## Variables de entorno

Copiar `.env.example` a `.env.local` y completar:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
FIREBASE_ADMIN_PROJECT_ID=

APP_URL=http://localhost:3000
```

## Correr local

```bash
npm install
npm run dev
```

## Firebase setup

1. Crear proyecto Firebase.
2. Activar Auth (Email/Password).
3. Crear Firestore y Storage.
4. Cargar `firestore.rules`, `firestore.indexes.json`, `storage.rules`.
5. Crear cuenta de servicio y completar variables `FIREBASE_*`.

## Flujo de usuarios admin (sin signup público)

1. Superadmin/admin crea invitación en `/admin/invitations`.
2. Se genera token y link `/invite/[token]`.
3. Invitado completa nombre, email y password.
4. Se crea registro en `/users` y se marca invitación como `accepted`.
5. Luego login normal en `/admin/login`.

## Accesos públicos y privados

- Público: `/`, `/about`, `/team`, `/team/[slug]`, `/blog`, `/blog/[slug]`, `/contact`.
- Privado: `/admin/*` (requiere sesión admin).
- No público: `/stats` queda deshabilitado en frontend público y no se indexa.

Links útiles:

- Home: `http://localhost:3000/`
- Team Jean: `http://localhost:3000/team/jean`
- Team Mel: `http://localhost:3000/team/mel`
- Blog: `http://localhost:3000/blog`
- Contacto: `http://localhost:3000/contact`
- Admin Login (interno): `http://localhost:3000/admin/login`

## Colecciones Firestore

- `users`: usuarios del panel y permisos granulares.
- `invitations`: invitaciones con token, rol, estado y expiración.
- `leads`: contactos entrantes desde formulario público.
- `leads/{leadId}/notes`: notas internas por lead.
- `clients`: clientes convertidos o creados internamente.
- `clients/{clientId}/notes`: notas internas por cliente.
- `clients/{clientId}/services`: servicios vendidos/entregables.
- `blogPosts`: posts del CMS.
- `blogLikes`: likes por sesión para anti-abuso básico.
- `siteSettings`: configuración editable de marca/sitio.
- `analyticsSnapshots`: snapshots para stats y series históricas.

## Despliegue

Se puede desplegar en Vercel o Firebase App Hosting.

### Scripts de build + deploy (Firebase)

El proyecto ya incluye scripts listos para build y deploy:

```bash
# Build del sitio
npm run firebase:build:site

# Deploy solo backend (reglas e índices)
npm run firebase:deploy:backend

# Deploy solo hosting (App Hosting)
npm run firebase:deploy:hosting

# Deploy backend + hosting
npm run firebase:deploy:all

# Build + deploy completo
npm run firebase:release
```

También podés usar el script bash:

```bash
./scripts/firebase-release.sh
```

### Si `firebase:deploy:hosting` falla con “Rollout failed”

El mensaje del CLI no incluye el detalle. Abrí [Firebase Console → App Hosting](https://console.firebase.google.com/project/_/apphosting), entrá al backend **las-girls** y revisá el **build** o **rollout** fallido (enlaza a Cloud Build / logs).

Causas frecuentes:

- **CVE / versión de Next**: el buildpack valida la versión de `next`; mantené `next` y `eslint-config-next` alineados en la última parche de tu línea (p. ej. 16.2.x). En el repo va `@apphosting/adapter-nextjs` como devDependency para alinearse con el adaptador que usa Cloud Build.
- **Secreto `LASGIRLS_FIREBASE_WEB_API_KEY`**: debe existir y el backend de App Hosting debe tener permiso (Secret Manager). Si falta: `npx firebase-tools apphosting:secrets:set LASGIRLS_FIREBASE_WEB_API_KEY` y volver a asociar el secreto al backend.
- **Memoria en runtime**: en `apphosting.yaml`, `runConfig.memoryMiB` está en 1024 para SSR; si aún hay OOM en logs de Cloud Run, subilo.

Para más contexto: [Manage rollouts](https://firebase.google.com/docs/app-hosting/rollouts).

### Checklist previo

- Variables de entorno productivas cargadas.
- Reglas Firestore/Storage aplicadas.
- Crear al menos un usuario `superadmin`.
- Probar flujo real de invitación + login.

## Estado de esta base

Implementado en esta etapa:

- Arquitectura modular de proyecto
- Home completa con copy real de marca
- Páginas públicas base
- Formulario de contacto conectado a Firestore
- Blog público con markdown + likes
- Admin base funcional (login, dashboard, leads, clients, blog, media, users, invitations, stats)
- Conversión lead -> client por endpoint admin

Pendiente para próximas iteraciones:

- CRUD completo con edición avanzada en todos los módulos
- Notas internas (UI completa) para leads/clientes
- Gráficas avanzadas en stats con agregaciones reales
- Sistema de permisos aplicado por pantalla y acción en UI
- Tests automatizados (unitarios + integración)
