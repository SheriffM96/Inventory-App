"use client";

import { useMemo, useState } from "react";

export type ItemOption = { id: string; name: string; unit: string; category: string };

export default function CategoryItemPicker({
  items,
  itemFieldName,
  idPrefix,
  required,
}: {
  items: ItemOption[];
  itemFieldName: string;
  idPrefix: string;
  required?: boolean;
}) {
  const categories = useMemo(
    () => Array.from(new Set(items.map((i) => i.category))).sort(),
    [items]
  );
  const [category, setCategory] = useState("");
  const [itemId, setItemId] = useState("");

  const itemsInCategory = useMemo(
    () => items.filter((i) => i.category === category).sort((a, b) => a.name.localeCompare(b.name)),
    [items, category]
  );
  const selectedItem = items.find((i) => i.id === itemId);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor={`${idPrefix}-category`}>
          Category
        </label>
        <select
          id={`${idPrefix}-category`}
          className="input"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setItemId("");
          }}
          required={required}
        >
          <option value="" disabled>
            Select a category
          </option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor={`${idPrefix}-item`}>
          Item {selectedItem ? `(unit: ${selectedItem.unit})` : ""}
        </label>
        <select
          id={`${idPrefix}-item`}
          name={itemFieldName}
          className="input"
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          disabled={!category}
          required={required}
        >
          <option value="" disabled>
            {category ? "Select an item" : "Choose a category first"}
          </option>
          {itemsInCategory.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
