"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { importItemsAction, ItemFormState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Uploading..." : "Upload & Import"}
    </button>
  );
}

export default function ImportItemsForm() {
  const initialState: ItemFormState = {};
  const [state, formAction] = useFormState(importItemsAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <p className="text-sm text-stone-600">
        Upload an .xlsx file with columns <strong>Item</strong> (or <strong>Name</strong>),{" "}
        <strong>Category</strong>, and <strong>Unit</strong>. Existing items are matched by name and
        updated; new names are added. Nothing is ever removed automatically - deactivate items you no
        longer stock from the list below.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <input
          name="file"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="input"
          required
        />
        <SubmitButton />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
    </form>
  );
}
