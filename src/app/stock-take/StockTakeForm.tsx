"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitStockTakeAction, StockTakeFormState } from "./actions";

export type StockTakeRow = {
  id: string;
  name: string;
  category: string;
  unit: string;
  systemQuantity: number;
  lastCountDate: Date | null;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Saving..." : "Save Stock Take"}
    </button>
  );
}

export default function StockTakeForm({ rows }: { rows: StockTakeRow[] }) {
  const initialState: StockTakeFormState = {};
  const [state, formAction] = useFormState(submitStockTakeAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [search, setSearch] = useState("");
  const searchLower = search.trim().toLowerCase();

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      setSearch("");
    }
  }, [state]);

  const byCategory = useMemo(() => {
    const map = new Map<string, StockTakeRow[]>();
    for (const row of rows) {
      const list = map.get(row.category) ?? [];
      list.push(row);
      map.set(row.category, list);
    }
    return map;
  }, [rows]);

  const anyMatch = rows.some((row) => !searchLower || row.name.toLowerCase().includes(searchLower));

  if (rows.length === 0) {
    return <p className="text-sm text-stone-500">No active items to count yet.</p>;
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <label htmlFor="stock-take-search" className="sr-only">
        Search items
      </label>
      <input
        id="stock-take-search"
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search items..."
        className="input sm:max-w-xs"
      />
      <div className="space-y-4 max-h-[28rem] overflow-y-auto pr-1">
        {Array.from(byCategory.entries()).map(([category, items]) => {
          const categoryHasMatch = items.some(
            (row) => !searchLower || row.name.toLowerCase().includes(searchLower)
          );
          return (
            <div key={category} className={categoryHasMatch ? undefined : "hidden"}>
              <h3 className="text-sm font-semibold text-stone-500 mb-2">{category}</h3>
              <div className="space-y-2">
                {items.map((row) => {
                  const matches = !searchLower || row.name.toLowerCase().includes(searchLower);
                  return (
                    <div
                      key={row.id}
                      className={`grid grid-cols-[1fr_auto] items-center gap-3 ${matches ? "" : "hidden"}`}
                    >
                      <div className="text-sm">
                        {row.name}
                        <span className="text-stone-400">
                          {" "}
                          - system estimate {row.systemQuantity} {row.unit}
                          {row.lastCountDate && (
                            <> (last counted {new Date(row.lastCountDate).toLocaleDateString()})</>
                          )}
                        </span>
                      </div>
                      <input
                        name={`qty_${row.id}`}
                        aria-label={`Counted quantity: ${row.name}`}
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        placeholder={String(row.systemQuantity)}
                        className="input w-28"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        {!anyMatch && <p className="text-sm text-stone-500">No items match your search.</p>}
      </div>
      <div>
        <label className="label" htmlFor="stock-take-notes">
          Notes (optional)
        </label>
        <input id="stock-take-notes" name="notes" type="text" className="input" placeholder="e.g. rollout baseline count" />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
      <SubmitButton />
    </form>
  );
}
