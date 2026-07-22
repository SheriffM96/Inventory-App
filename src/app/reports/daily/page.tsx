import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";
import { startOfDay, endOfDay, parseDateParam, toDateInputValue, formatMoney } from "@/lib/dates";

export default async function DailyReportPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  await requireRole(["MANAGER"]);

  const date = parseDateParam(searchParams.date);
  const range = { gte: startOfDay(date), lte: endOfDay(date) };

  const [purchases, usage] = await Promise.all([
    prisma.purchase.findMany({ where: { date: range }, include: { item: true } }),
    prisma.usage.findMany({ where: { date: range }, include: { item: true } }),
  ]);

  const purchasedByItem = new Map<string, { name: string; unit: string; qty: number; cost: number }>();
  for (const p of purchases) {
    const entry = purchasedByItem.get(p.itemId) ?? { name: p.item.name, unit: p.item.unit, qty: 0, cost: 0 };
    entry.qty += Number(p.quantity);
    entry.cost += p.totalCost ? Number(p.totalCost) : 0;
    purchasedByItem.set(p.itemId, entry);
  }

  const usedByItem = new Map<string, { name: string; unit: string; qty: number }>();
  for (const u of usage) {
    const entry = usedByItem.get(u.itemId) ?? { name: u.item.name, unit: u.item.unit, qty: 0 };
    entry.qty += Number(u.quantity);
    usedByItem.set(u.itemId, entry);
  }

  const totalSpend = Array.from(purchasedByItem.values()).reduce((sum, e) => sum + e.cost, 0);
  const dateValue = toDateInputValue(date);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold">Daily Consumption Report</h1>
        <div className="flex items-center gap-3">
          <form method="GET" className="flex items-center gap-2">
            <input type="date" name="date" defaultValue={dateValue} className="input" />
            <button type="submit" className="btn-secondary">
              View
            </button>
          </form>
          <a href={`/api/reports/daily?date=${dateValue}`} className="btn-primary">
            Download CSV
          </a>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Items Used - {dateValue}</h2>
        {usedByItem.size === 0 ? (
          <p className="text-sm text-stone-500">No usage logged for this date.</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity Used</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(usedByItem.values()).map((e) => (
                <tr key={e.name}>
                  <td>{e.name}</td>
                  <td>
                    {e.qty} {e.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Items Purchased - {dateValue}</h2>
        {purchasedByItem.size === 0 ? (
          <p className="text-sm text-stone-500">No purchases logged for this date.</p>
        ) : (
          <>
            <table className="table-base">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity Bought</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(purchasedByItem.values()).map((e) => (
                  <tr key={e.name}>
                    <td>{e.name}</td>
                    <td>
                      {e.qty} {e.unit}
                    </td>
                    <td>{e.cost ? formatMoney(e.cost) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-sm font-medium mt-3">Total spend: {formatMoney(totalSpend)}</p>
          </>
        )}
      </div>
    </div>
  );
}
