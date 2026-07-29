"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import CategoryItemPicker, { ItemOption } from "@/components/CategoryItemPicker";
import { logIssuanceAction, LogFormState } from "./actions";

export type RecipientOption = { id: string; name: string; team: string };

const TEAM_LABELS: Record<string, string> = {
  KITCHEN: "Kitchen",
  BAR: "Bar",
  CLEANING: "Cleaning",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Saving..." : "Log Issuance"}
    </button>
  );
}

export default function IssuanceForm({ items, recipients }: { items: ItemOption[]; recipients: RecipientOption[] }) {
  const initialState: LogFormState = {};
  const [state, formAction] = useFormState(logIssuanceAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [resetCount, setResetCount] = useState(0);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setResetCount((c) => c + 1);
    }
  }, [state]);

  const byTeam = new Map<string, RecipientOption[]>();
  for (const r of recipients) {
    const list = byTeam.get(r.team) ?? [];
    list.push(r);
    byTeam.set(r.team, list);
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <CategoryItemPicker key={resetCount} items={items} itemFieldName="itemId" idPrefix="issuance" required />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="issuance-quantity">
            Quantity issued
          </label>
          <input
            id="issuance-quantity"
            name="quantity"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0.01"
            className="input"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="issuance-recipient">
            Issued to
          </label>
          <select id="issuance-recipient" name="recipientId" className="input" defaultValue="" required>
            <option value="" disabled>
              Select who received it
            </option>
            {Array.from(byTeam.entries()).map(([team, people]) => (
              <optgroup key={team} label={TEAM_LABELS[team] ?? team}>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="issuance-notes">
          Notes (optional)
        </label>
        <input id="issuance-notes" name="notes" type="text" className="input" placeholder="e.g. for tonight's service" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
      <SubmitButton />
    </form>
  );
}
