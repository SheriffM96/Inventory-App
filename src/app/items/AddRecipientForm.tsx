"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createRecipientAction, RecipientFormState } from "./recipient-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Adding..." : "Add Recipient"}
    </button>
  );
}

export default function AddRecipientForm() {
  const initialState: RecipientFormState = {};
  const [state, formAction] = useFormState(createRecipientAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap gap-3 items-end">
      <div>
        <label className="label" htmlFor="new-recipient-name">
          Name
        </label>
        <input id="new-recipient-name" name="name" type="text" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="new-recipient-team">
          Team
        </label>
        <select id="new-recipient-team" name="team" className="input" defaultValue="KITCHEN">
          <option value="KITCHEN">Kitchen</option>
          <option value="BAR">Bar</option>
          <option value="CLEANING">Cleaning</option>
        </select>
      </div>
      <SubmitButton />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
    </form>
  );
}
