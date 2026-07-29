"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import CategoryItemPicker, { ItemOption } from "@/components/CategoryItemPicker";
import { addRecipeItemAction, RecipeFormState } from "./recipe-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Adding..." : "Add Ingredient"}
    </button>
  );
}

export default function AddRecipeItemForm({ menuItemId, items }: { menuItemId: string; items: ItemOption[] }) {
  const initialState: RecipeFormState = {};
  const [state, formAction] = useFormState(addRecipeItemAction, initialState);
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
      <input type="hidden" name="menuItemId" value={menuItemId} />
      <CategoryItemPicker key={resetCount} items={items} itemFieldName="itemId" idPrefix="recipe-item" required />
      <div>
        <label className="label" htmlFor="recipe-qty-per-unit">
          Quantity per unit sold
        </label>
        <input
          id="recipe-qty-per-unit"
          name="quantityPerUnit"
          type="number"
          inputMode="decimal"
          step="0.0001"
          min="0.0001"
          className="input max-w-xs"
          placeholder="e.g. 0.35"
          required
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
      <SubmitButton />
    </form>
  );
}
