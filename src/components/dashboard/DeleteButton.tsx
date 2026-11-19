"use client";

import { useTransition } from "react";

export function DeleteButton({ action, label }: { action: () => Promise<unknown>; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      className="btn text-danger"
      disabled={pending}
      aria-label={label}
      onClick={() => {
        if (confirm("Delete this item? This can't be undone.")) start(async () => void (await action()));
      }}
    >
      {pending ? "…" : "Delete"}
    </button>
  );
}
