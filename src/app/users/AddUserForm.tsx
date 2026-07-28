"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createUserAction, UserFormState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Adding..." : "Add Staff Member"}
    </button>
  );
}

export default function AddUserForm() {
  const initialState: UserFormState = {};
  const [state, formAction] = useFormState(createUserAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-3 sm:grid-cols-4 items-end">
      <div>
        <label className="label">Name</label>
        <input name="name" type="text" className="input" required />
      </div>
      <div>
        <label className="label">Role</label>
        <select name="role" className="input" defaultValue="STOREKEEPER">
          <option value="STOREKEEPER">Storekeeper</option>
          <option value="KITCHEN">Kitchen Staff</option>
          <option value="BAR">Bar Staff</option>
          <option value="MANAGER">Manager</option>
          <option value="SUPERVISOR">Supervisor</option>
        </select>
      </div>
      <div>
        <label className="label">4-digit PIN</label>
        <input name="pin" type="text" inputMode="numeric" maxLength={8} className="input" required />
      </div>
      <div className="sm:col-span-4">
        {state?.error && <p className="text-sm text-red-600 mb-2">{state.error}</p>}
        {state?.success && <p className="text-sm text-green-700 mb-2">{state.success}</p>}
        <SubmitButton />
      </div>
    </form>
  );
}
