"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import CategoryItemPicker, { ItemOption } from "@/components/CategoryItemPicker";
import { toDateTimeLocalValue } from "@/lib/dates";
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
  const [resetCount, setResetCount] = useState(0);
  const [now, setNow] = useState("");

  useEffect(() => {
    setNow(toDateTimeLocalValue(new Date()));
  }, [resetCount]);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setResetCount((c) => c + 1);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <CategoryItemPicker key={resetCount} items={items} itemFieldName="itemId" idPrefix="purchase" required />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Quantity bought</label>
          <input name="quantity" type="number" step="0.01" min="0.01" className="input" required />
        </div>
        <div>
          <label className="label">Cost (total paid, optional)</label>
          <input name="cost" type="number" step="0.01" min="0" className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="purchase-occurredAt">
          Date &amp; time received
        </label>
        <input
          id="purchase-occurredAt"
          name="occurredAt"
          type="datetime-local"
          className="input"
          value={now}
          onChange={(e) => setNow(e.target.value)}
          required
        />
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
