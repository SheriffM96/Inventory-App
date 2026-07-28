"use client";

import { useMemo } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitReconciliationAction, ReconciliationFormState } from "./actions";

export type MenuItemOption = { id: string; name: string; category: string };

type ExistingReconciliation = {
  id: string;
  cashTotal: unknown;
  transferTotal: unknown;
  posTotal: unknown;
  notes: string | null;
  status: "PENDING" | "CONFIRMED" | "DISPUTED";
  managerNotes: string | null;
  saleLines: { menuItemId: string; quantitySold: unknown; menuItem: { name: string } }[];
} | null;

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending manager review",
  CONFIRMED: "Confirmed by manager",
  DISPUTED: "Disputed by manager",
};

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 border-amber-300 text-amber-800",
  CONFIRMED: "bg-green-50 border-green-300 text-green-800",
  DISPUTED: "bg-red-50 border-red-300 text-red-800",
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Saving..." : "Save Reconciliation"}
    </button>
  );
}

export default function ReconciliationForm({
  menuItems,
  existing,
}: {
  menuItems: MenuItemOption[];
  existing: ExistingReconciliation;
}) {
  const initialState: ReconciliationFormState = {};
  const [state, formAction] = useFormState(submitReconciliationAction, initialState);

  const byCategory = useMemo(() => {
    const map = new Map<string, MenuItemOption[]>();
    for (const item of menuItems) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [menuItems]);

  const existingQtyByMenuItem = useMemo(() => {
    const map = new Map<string, number>();
    for (const line of existing?.saleLines ?? []) {
      map.set(line.menuItemId, Number(line.quantitySold));
    }
    return map;
  }, [existing]);

  if (existing && existing.status !== "PENDING") {
    return (
      <div className="space-y-4">
        <div className={`border rounded-md px-3 py-2 text-sm ${STATUS_STYLES[existing.status]}`}>
          {STATUS_LABELS[existing.status]}
          {existing.managerNotes && (
            <>
              <br />
              <span className="font-medium">Manager note:</span> {existing.managerNotes}
            </>
          )}
        </div>
        <div className="text-sm">
          <p>Cash: {Number(existing.cashTotal).toFixed(2)}</p>
          <p>Transfer: {Number(existing.transferTotal).toFixed(2)}</p>
          <p>POS: {Number(existing.posTotal).toFixed(2)}</p>
          {existing.notes && <p className="text-stone-500">Notes: {existing.notes}</p>}
        </div>
        <p className="text-sm text-stone-500">
          Today&apos;s reconciliation has already been reviewed and can no longer be edited.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {existing?.status === "PENDING" && (
        <div className={`border rounded-md px-3 py-2 text-sm ${STATUS_STYLES.PENDING}`}>
          {STATUS_LABELS.PENDING} - you can still edit and resave until the manager acts on it.
        </div>
      )}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Cash</label>
          <input
            name="cashTotal"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            defaultValue={existing ? Number(existing.cashTotal) : undefined}
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">Transfer</label>
          <input
            name="transferTotal"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            defaultValue={existing ? Number(existing.transferTotal) : undefined}
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">POS</label>
          <input
            name="posTotal"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            defaultValue={existing ? Number(existing.posTotal) : undefined}
            className="input"
            required
          />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-2">Sales by Item</h3>
        <p className="text-xs text-stone-500 mb-3">
          Enter quantity sold for each dish/drink. Leave blank for anything not sold today.
        </p>
        {menuItems.length === 0 ? (
          <p className="text-sm text-stone-500">
            No menu items set up yet - ask your manager to add them under Items &amp; Vendors.
          </p>
        ) : (
          <div className="space-y-4 max-h-[24rem] overflow-y-auto pr-1">
            {Array.from(byCategory.entries()).map(([category, categoryItems]) => (
              <div key={category}>
                <h4 className="text-sm font-semibold text-stone-500 mb-2">{category}</h4>
                <div className="space-y-2">
                  {categoryItems.map((item) => (
                    <div key={item.id} className="grid grid-cols-[1fr_auto] items-center gap-3">
                      <div className="text-sm">{item.name}</div>
                      <input
                        name={`qty_${item.id}`}
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        defaultValue={existingQtyByMenuItem.get(item.id)}
                        placeholder="0"
                        className="input w-28"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="label">Notes (optional)</label>
        <input
          name="notes"
          type="text"
          defaultValue={existing?.notes ?? ""}
          className="input"
          placeholder="e.g. discount given, walkout, etc."
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
      <SubmitButton />
    </form>
  );
}
