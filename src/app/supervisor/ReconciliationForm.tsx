"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitReconciliationAction, ReconciliationFormState } from "./actions";

export type MenuItemOption = { id: string; name: string; category: string };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Saving..." : "Submit Reconciliation"}
    </button>
  );
}

function formatAmount(value: number): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ReconciliationForm({ menuItems }: { menuItems: MenuItemOption[] }) {
  const initialState: ReconciliationFormState = {};
  const [state, formAction] = useFormState(submitReconciliationAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [resetCount, setResetCount] = useState(0);

  const [cashTotal, setCashTotal] = useState("");
  const [transferTotal, setTransferTotal] = useState("");
  const [posTotal, setPosTotal] = useState("");
  const totalSales = (Number(cashTotal) || 0) + (Number(transferTotal) || 0) + (Number(posTotal) || 0);

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setCashTotal("");
      setTransferTotal("");
      setPosTotal("");
      setResetCount((c) => c + 1);
    }
  }, [state]);

  const byCategory = useMemo(() => {
    const map = new Map<string, MenuItemOption[]>();
    for (const item of menuItems) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [menuItems]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Cash</label>
          <input
            name="cashTotal"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={cashTotal}
            onChange={(e) => setCashTotal(e.target.value)}
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
            value={transferTotal}
            onChange={(e) => setTransferTotal(e.target.value)}
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
            value={posTotal}
            onChange={(e) => setPosTotal(e.target.value)}
            className="input"
            required
          />
        </div>
      </div>
      <p className="text-sm font-medium">Total Sales: {formatAmount(totalSales)}</p>

      <div>
        <h3 className="text-sm font-semibold text-stone-700 mb-2">Sales by Item</h3>
        <p className="text-xs text-stone-500 mb-3">
          Enter quantity sold for each dish/drink. Leave blank for anything not sold this time.
        </p>
        {menuItems.length === 0 ? (
          <p className="text-sm text-stone-500">
            No menu items set up yet - ask your manager to add them under Items &amp; Vendors.
          </p>
        ) : (
          <div key={resetCount} className="space-y-4 max-h-[24rem] overflow-y-auto pr-1">
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
          className="input"
          placeholder="e.g. discount given, walkout, which shift"
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
      <SubmitButton />
    </form>
  );
}
