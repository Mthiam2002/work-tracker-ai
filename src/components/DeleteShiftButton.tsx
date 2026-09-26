"use client";

import { useState, useTransition } from "react";
import { deleteWorkShift } from "@/app/(protected)/shifts/shifts-actions";

export function DeleteShiftButton({ id, onDeleted }: { id: string; onDeleted?: (id: string) => void }) {
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="rounded-full px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
      >
        Supprimer
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={isPending}
        onClick={() => startTransition(async () => { await deleteWorkShift(id); onDeleted?.(id); })}
        className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
      >
        {isPending ? "..." : "Confirmer"}
      </button>
      <button
        type="button"
        onClick={() => setConfirm(false)}
        className="rounded-full px-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
      >
        Annuler
      </button>
    </span>
  );
}
