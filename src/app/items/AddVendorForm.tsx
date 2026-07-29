"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createVendorAction, VendorFormState } from "./vendor-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Adding..." : "Add Vendor"}
    </button>
  );
}

export default function AddVendorForm() {
  const initialState: VendorFormState = {};
  const [state, formAction] = useFormState(createVendorAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap gap-3 items-end">
      <div>
        <label className="label" htmlFor="new-vendor-name">
          Vendor name
        </label>
        <input id="new-vendor-name" name="name" type="text" className="input" required />
      </div>
      <SubmitButton />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
    </form>
  );
}
