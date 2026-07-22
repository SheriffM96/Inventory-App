"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import ItemSelect, { ItemOption } from "@/components/ItemSelect";
import { logPurchaseAction, LogFormState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Saving..." : "Log Purchase"}
    </button>
  );
}

export default function PurchaseForm({ items }: { items: ItemOption[] }) {
  const initialState: LogFormState = {};
  const [state, formAction] = useFormState(logPurchaseAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div>
        <label className="label" htmlFor="purchase-item">
          Item
        </label>
        <ItemSelect id="purchase-item" items={items} name="itemId" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Quantity bought</label>
          <input name="quantity" type="number" step="0.01" min="0.01" className="input" required />
        </div>
        <div>
          <label className="label">Unit price (optional)</label>
          <input name="unitPrice" type="number" step="0.01" min="0" className="input" />
        </div>
      </div>
      <div>
        <label className="label">Notes (optional)</label>
        <input name="notes" type="text" className="input" placeholder="e.g. supplier name" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
      <SubmitButton />
    </form>
  );
}
