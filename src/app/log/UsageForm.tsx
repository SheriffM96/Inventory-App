"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import CategoryItemPicker, { ItemOption } from "@/components/CategoryItemPicker";
import { toDateTimeLocalValue } from "@/lib/dates";
import { logUsageAction, LogFormState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Saving..." : "Log Usage"}
    </button>
  );
}

export default function UsageForm({ items, role }: { items: ItemOption[]; role: string }) {
  const initialState: LogFormState = {};
  const [state, formAction] = useFormState(logUsageAction, initialState);
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

  const lockedDepartment = role === "KITCHEN" ? "Kitchen" : role === "BAR" ? "Bar" : null;

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <CategoryItemPicker key={resetCount} items={items} itemFieldName="itemId" idPrefix="usage" required />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Quantity used</label>
          <input name="quantity" type="number" step="0.01" min="0.01" className="input" required />
        </div>
        <div>
          <label className="label">Issued to</label>
          {lockedDepartment ? (
            <input className="input bg-stone-100" value={lockedDepartment} disabled readOnly />
          ) : (
            <select name="department" className="input" defaultValue="KITCHEN">
              <option value="KITCHEN">Kitchen</option>
              <option value="BAR">Bar</option>
              <option value="OTHER">Other</option>
            </select>
          )}
        </div>
      </div>
      <div>
        <label className="label" htmlFor="usage-occurredAt">
          Date &amp; time used
        </label>
        <input
          id="usage-occurredAt"
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
        <input name="notes" type="text" className="input" placeholder="e.g. for tonight's service" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
      <SubmitButton />
    </form>
  );
}
