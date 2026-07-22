"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import ItemSelect, { ItemOption } from "@/components/ItemSelect";
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

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div>
        <label className="label" htmlFor="usage-item">
          Item
        </label>
        <ItemSelect id="usage-item" items={items} name="itemId" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Quantity used</label>
          <input name="quantity" type="number" step="0.01" min="0.01" className="input" required />
        </div>
        <div>
          <label className="label">Issued to</label>
          <select name="department" className="input" defaultValue="KITCHEN">
            <option value="KITCHEN">Kitchen</option>
            <option value="BAR">Bar</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Notes (optional)</label>
        <input name="notes" type="text" className="input" placeholder="e.g. for tonight's service" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
      <SubmitButton />
    </form>
  );
}
