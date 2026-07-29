import { requireRole } from "@/lib/require-session";
import { computeStockLevels } from "@/lib/stock";
import ScrollableTable from "@/components/ScrollableTable";
import ListSearch from "@/components/ListSearch";

export default async function SupervisorStockPage() {
  await requireRole(["SUPERVISOR"]);

  const stockLevels = await computeStockLevels();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Current Stock Levels</h1>

      <div className="card">
        <ListSearch scopeId="supervisor-stock-levels" label="Search stock levels by item or category" placeholder="Search by item or category..." />
        <div data-search-scope="supervisor-stock-levels">
          <ScrollableTable>
            <table className="table-base">
              <thead>
                <tr>
                  <th className="sticky top-0 bg-white z-10">Category</th>
                  <th className="sticky top-0 bg-white z-10">Item</th>
                  <th className="sticky top-0 bg-white z-10">On Hand</th>
                </tr>
              </thead>
              <tbody>
                {stockLevels.map((s) => (
                  <tr
                    key={s.itemId}
                    data-search-row
                    data-search={`${s.name} ${s.category}`.toLowerCase()}
                    className={s.lowStock ? "bg-amber-50" : undefined}
                  >
                    <td className="text-stone-500">{s.category}</td>
                    <td>{s.name}</td>
                    <td className="font-medium">
                      {s.remaining} {s.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollableTable>
          <p data-search-empty className="hidden text-sm text-stone-500 pt-2">
            No items match your search.
          </p>
        </div>
      </div>
    </div>
  );
}
