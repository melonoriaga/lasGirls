# Módulo Gastos compartidos

> Esta nota se muestra en el admin (icono de ayuda junto al título) vía `GET /api/admin/expenses/help`, que lee este archivo.

## Propósito

Gestionar gastos mensuales compartidos y pagos entre integrantes del **equipo real** (Firebase Auth), con balances **por moneda** sin conversión automática.

## Integrantes (quién aparece en los selectores)

No hay colección `expenseMembers` ni nombres de ejemplo: los participantes se arman con `listMergedTeamUsers()` (usuarios con cuenta Auth activa y no deshabilitada). En movimientos y recurrencias, `memberId` / `paidByMemberId` son **UIDs de Firebase Auth** (las mismas identidades que inician sesión en el admin). Las APIs devuelven en `members` nombre para mostrar, `username` y `photoURL` del perfil (`users/{uid}` + Auth) cuando existen, para la UI de gastos.

## Datos (Firestore)

- `expenseRecurrences/{id}` — plantilla de gasto recurrente mensual.
- `expensePeriods/{periodId}` — período mensual (`periodId` = `YYYY-MM`).
- `expensePeriods/{periodId}/movements/{movementId}` — movimientos:
  - `expense`: gasto con reparto (`participants` + `computedShareAmount`).
  - `settlement`: pago entre integrantes (`fromMemberId` → `toMemberId`).

Los movimientos no se borran: `status: active | canceled`.

## Cálculo (`computePeriodBalances`)

Solo entran movimientos **activos**. Por moneda:

- Cada **expense**: quien pagó suma el monto completo en su posición neta; cada participante resta su `computedShareAmount` (lo que le “tocaba” aportar).
- Cada **settlement** con monto `A`: quien paga (`from`) **suma** `A` al neto (debe menos); quien recibe (`to`) **resta** `A` (le deben menos).

Con dos integrantes, se genera texto tipo “Ana le debe a Luis 5 USD” (nombres según perfil del equipo).

## Recurrencias (`ensureRecurringExpensesGeneratedForPeriod`)

Idempotente: por período y recurrencia activa compatible con el mes, si no existe ya un movimiento con `generatedByRecurrence: true` y mismo `recurrenceId`, crea el gasto. Al crear una recurrencia se ejecuta además un backfill hasta el mes actual (`ensureRecurrenceBackfillToPresent`).

## API (`/api/admin/expenses/*`)

Requiere cookie de sesión admin (`getSessionActor`). Rutas principales:

- `GET /current` — mes actual (o `?periodId=`), asegura período, genera recurrentes y devuelve movimientos + balance.
- `GET /periods` — historial con `before=<mes actual>&cursor=&limit=` (paginación por `startAfter` en `documentId`).
- `GET /periods/[periodId]` — detalle.
- `POST /movements` — cuerpo `{ kind: 'expense' | 'settlement', ... }`.
- `PATCH /movements/[periodId]/[movementId]` — editar gasto.
- `DELETE /movements/[periodId]/[movementId]` — borrar **solo** un gasto (`expense`) y **solo** si `createdBy` coincide con la sesión (403 si no).
- `POST .../cancel` — anular movimiento.
- `GET|POST /recurrences`, `PATCH /recurrences/[id]`, `POST /recurrences/[id]/deactivate`.

## Reglas de seguridad

Restringir lectura/escritura a admins (mismo criterio que el resto del panel). Los datos son sensibles: asegurar reglas Firestore alineadas con roles del proyecto.
