"use client";

import type { ExpenseMember, ExpenseMovement } from "@/types/expenses";

type MovementRow = ExpenseMovement & { id: string };

function Avatar({ photoURL, label }: { photoURL?: string; label: string }) {
  const initial = (label.trim().slice(0, 1) || "?").toUpperCase();
  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-zinc-200 text-[11px] font-bold text-zinc-700">
      {photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoURL} alt="" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );
}

export function ExpenseParticipantBlock({
  member,
  fallbackLabel,
}: {
  member?: ExpenseMember;
  /** Si no hay perfil (ej. UID legacy) */
  fallbackLabel?: string;
}) {
  const name = member?.name ?? fallbackLabel ?? "—";
  const emailPreview = (member?.email ?? "").trim().slice(0, 10);
  const secondary = member?.username ? `@${member.username}` : emailPreview || null;
  return (
    <div className="flex min-w-0 max-w-[180px] items-center gap-2">
      <Avatar photoURL={member?.photoURL} label={name} />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium leading-tight text-zinc-900">{name}</p>
        {secondary ? (
          <p className="truncate text-[10px] leading-tight text-zinc-500">{secondary}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Gasto: quién pagó + lista de participantes con monto aportado. */
export function ExpensePayerSplitCell({
  movement,
  byId,
  nameFallback,
}: {
  movement: MovementRow;
  byId: Record<string, ExpenseMember | undefined>;
  nameFallback: Record<string, string>;
}) {
  const payerId = movement.paidByMemberId ?? "";
  const payer = payerId ? byId[payerId] : undefined;
  const parts = movement.participants ?? [];

  return (
    <div className="space-y-2 py-0.5">
      <div>
        <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-zinc-500">Pagó</p>
        <ExpenseParticipantBlock member={payer} fallbackLabel={nameFallback[payerId] ?? payerId} />
      </div>
      <div>
        <p className="mb-1 text-[9px] font-semibold uppercase tracking-wide text-zinc-500">Reparto</p>
        <ul className="space-y-1.5">
          {parts.map((p) => {
            const m = byId[p.memberId];
            return (
              <li key={p.memberId} className="flex items-start justify-between gap-2">
                <ExpenseParticipantBlock member={m} fallbackLabel={nameFallback[p.memberId] ?? p.memberId} />
                <span className="shrink-0 pt-1 font-mono text-[10px] tabular-nums text-zinc-600">
                  {movement.currency} {p.computedShareAmount.toFixed(2)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Pago entre personas: de → hacia con avatar. */
export function SettlementFlowCell({
  movement,
  byId,
  nameFallback,
}: {
  movement: MovementRow;
  byId: Record<string, ExpenseMember | undefined>;
  nameFallback: Record<string, string>;
}) {
  const fid = movement.fromMemberId ?? "";
  const tid = movement.toMemberId ?? "";
  return (
    <div className="flex flex-wrap items-center gap-2 py-0.5">
      <ExpenseParticipantBlock member={byId[fid]} fallbackLabel={nameFallback[fid] ?? fid} />
      <span className="text-zinc-400" aria-hidden>
        →
      </span>
      <ExpenseParticipantBlock member={byId[tid]} fallbackLabel={nameFallback[tid] ?? tid} />
    </div>
  );
}
