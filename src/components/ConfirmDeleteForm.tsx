"use client";

import { useTransition } from "react";

export default function ConfirmDeleteForm({
  action,
  id,
  confirmMessage,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  confirmMessage: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      aria-label={`Delete: ${confirmMessage}`}
      className="text-xs text-red-600 hover:underline whitespace-nowrap disabled:opacity-50"
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        const formData = new FormData();
        formData.set("id", id);
        startTransition(() => {
          action(formData);
        });
      }}
    >
      {isPending ? "Deleting..." : "Delete"}
    </button>
  );
}
