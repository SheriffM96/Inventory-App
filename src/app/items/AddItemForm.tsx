"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { UNITS } from "@/lib/units";
import { createItemAction, ItemFormState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Adding..." : "Add Item"}
    </button>
  );
}

export default function AddItemForm({ categories }: { categories: string[] }) {
  const initialState: ItemFormState = {};
  const [state, formAction] = useFormState(createItemAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-5 items-end">
      <div className="sm:col-span-2">
        <label className="label">Item name</label>
        <input name="name" type="text" className="input" required />
      </div>
      <div>
        <label className="label">Category</label>
        <input name="category" type="text" list="categories" className="input" required />
        <datalist id="categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <div>
        <label className="label">Unit</label>
        <select name="unit" className="input" defaultValue="" required>
          <option value="" disabled>
            Select a unit
          </option>
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Reorder level (optional)</label>
        <input name="reorderLevel" type="number" inputMode="decimal" step="0.01" min="0" className="input" />
      </div>
      <div className="sm:col-span-5">
        {state?.error && <p className="text-sm text-red-600 mb-2">{state.error}</p>}
        {state?.success && <p className="text-sm text-green-700 mb-2">{state.success}</p>}
        <SubmitButton />
      </div>
    </form>
  );
}
