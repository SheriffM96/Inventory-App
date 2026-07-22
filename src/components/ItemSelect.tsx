export type ItemOption = { id: string; name: string; unit: string; category: string };

export default function ItemSelect({
  items,
  ...props
}: { items: ItemOption[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const byCategory = new Map<string, ItemOption[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  return (
    <select {...props} className="input" defaultValue="">
      <option value="" disabled>
        Select an item
      </option>
      {Array.from(byCategory.entries()).map(([category, categoryItems]) => (
        <optgroup key={category} label={category}>
          {categoryItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.unit})
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
