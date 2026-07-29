"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import CategoryItemPicker, { ItemOption } from "@/components/CategoryItemPicker";
import { logUsageAction, LogFormState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Saving..." : "Log Usage"}
    </button>
  );
}

export default function UsageForm({ items }: { items: ItemOption[] }) {
  const initialState: LogFormState = {};
  const [state, formAction] = useFormState(logUsageAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [resetCount, setResetCount] = useState(0);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setResetCount((c) => c + 1);
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <CategoryItemPicker key={resetCount} items={items} itemFieldName="itemId" idPrefix="usage" required />
      <div>
        <label className="label" htmlFor="usage-quantity">
          Quantity used
        </label>
        <input
          id="usage-quantity"
          name="quantity"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0.01"
          className="input"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="usage-notes">
          Notes (optional)
        </label>
        <input id="usage-notes" name="notes" type="text" className="input" placeholder="e.g. for tonight's service" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
      <SubmitButton />
    </form>
  );
}
