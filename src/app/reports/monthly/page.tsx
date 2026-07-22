import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";
import { parseMonthParam, monthRange, toMonthInputValue, formatMoney } from "@/lib/dates";
import { computeStockLevels } from "@/lib/stock";

export default async function MonthlyReportPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  await requireRole(["MANAGER"]);

  const { year, month } = parseMonthParam(searchParams.month);
  const { start, end } = monthRange(year, month);
  const monthValue = toMonthInputValue(start);

  const [purchases, usage, remainingAsOfMonthEnd] = await Promise.all([
    prisma.purchase.findMany({ where: { date: { gte: start, lte: end } }, include: { item: true } }),
    prisma.usage.findMany({ where: { date: { gte: start, lte: end } }, include: { item: true } }),
    computeStockLevels(end),
  ]);

  type Row = {
    itemId: string;
    name: string;
    unit: string;
    qtyBought: number;
    amountSpent: number;
    qtyUsed: number;
    remaining: number;
  };

  const rows = new Map<string, Row>();
  const remainingByItem = new Map(remainingAsOfMonthEnd.map((s) => [s.itemId, s.remaining]));

  for (const p of purchases) {
    const row = rows.get(p.itemId) ?? {
      itemId: p.itemId,
      name: p.item.name,
      unit: p.item.unit,
      qtyBought: 0,
      amountSpent: 0,
      qtyUsed: 0,
      remaining: remainingByItem.get(p.itemId) ?? 0,
    };
    row.qtyBought += Number(p.quantity);
    row.amountSpent += p.totalCost ? Number(p.totalCost) : 0;
    rows.set(p.itemId, row);
  }

  for (const u of usage) {
    const row = rows.get(u.itemId) ?? {
      itemId: u.itemId,
      name: u.item.name,
      unit: u.item.unit,
      qtyBought: 0,
      amountSpent: 0,
      qtyUsed: 0,
      remaining: remainingByItem.get(u.itemId) ?? 0,
    };
    row.qtyUsed += Number(u.quantity);
    rows.set(u.itemId, row);
  }

  const sortedRows = Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name));
  const totalSpent = sortedRows.reduce((sum, r) => sum + r.amountSpent, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-semibold">Monthly Report</h1>
        <div className="flex items-center gap-3">
          <form method="GET" className="flex items-center gap-2">
            <input type="month" name="month" defaultValue={monthValue} className="input" />
            <button type="submit" className="btn-secondary">
              View
            </button>
          </form>
          <a href={`/api/reports/monthly?month=${monthValue}`} className="btn-primary">
            Download CSV
          </a>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">{monthValue} - Bought, Used &amp; Remaining</h2>
        {sortedRows.length === 0 ? (
          <p className="text-sm text-stone-500">No activity logged for this month.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty Bought</th>
                    <th>Amount Spent</th>
                    <th>Qty Used</th>
                    <th>Qty Remaining (end of month)</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((r) => (
                    <tr key={r.itemId}>
                      <td>{r.name}</td>
                      <td>
                        {r.qtyBought} {r.unit}
                      </td>
                      <td>{r.amountSpent ? formatMoney(r.amountSpent) : "-"}</td>
                      <td>
                        {r.qtyUsed} {r.unit}
                      </td>
                      <td className="font-medium">
                        {r.remaining} {r.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm font-medium mt-3">Total spent this month: {formatMoney(totalSpent)}</p>
          </>
        )}
      </div>
    </div>
  );
}
