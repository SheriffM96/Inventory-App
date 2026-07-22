"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction, LoginState } from "./actions";

type StaffOption = { id: string; name: string; role: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}

export default function LoginForm({ users, next }: { users: StaffOption[]; next: string }) {
  const initialState: LoginState = {};
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="label" htmlFor="userId">
          Your name
        </label>
        <select id="userId" name="userId" className="input" required defaultValue="">
          <option value="" disabled>
            Select your name
          </option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="pin">
          PIN
        </label>
        <input
          id="pin"
          name="pin"
          type="password"
          inputMode="numeric"
          maxLength={8}
          className="input"
          placeholder="Enter your PIN"
          required
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton />
    </form>
  );
}
