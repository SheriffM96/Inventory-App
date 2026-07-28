"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createMenuItemAction, MenuItemFormState } from "./menu-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Adding..." : "Add Menu Item"}
    </button>
  );
}

export default function AddMenuItemForm({ categories }: { categories: string[] }) {
  const initialState: MenuItemFormState = {};
  const [state, formAction] = useFormState(createMenuItemAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap gap-3 items-end">
      <div>
        <label className="label">Dish/drink name</label>
        <input name="name" type="text" className="input" required />
      </div>
      <div>
        <label className="label">Category</label>
        <input name="category" type="text" list="menu-categories" className="input" required />
        <datalist id="menu-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>
      <SubmitButton />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
    </form>
  );
}
