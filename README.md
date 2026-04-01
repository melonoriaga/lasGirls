# Las Girls+ Web Platform

Base de producción para:

- Sitio público (home one-page + páginas auxiliares)
- Admin privado con Firebase Auth (sin registro abierto)
- CRM interno de leads/clientes/notas
- Blog con markdown + likes
- Media manager con Firebase Storage (1MB máx)
- Stats públicas e internas preparadas para datos reales

## Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- GSAP + ScrollTrigger
- Firebase Auth / Firestore / Storage
- React Hook Form + Zod

## Estructura principal

- `src/app/(public)`: home + about + team + blog + stats + contact
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
