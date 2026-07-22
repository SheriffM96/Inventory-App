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

  const [purchases, issuances, usage, remainingAsOfMonthEnd] = await Promise.all([
    prisma.purchase.findMany({ where: { date: { gte: start, lte: end } }, include: { item: true } }),
    prisma.issuance.findMany({ where: { date: { gte: start, lte: end } }, include: { item: true } }),
    prisma.usage.findMany({ where: { date: { gte: start, lte: end } }, include: { item: true } }),
    computeStockLevels(end),
  ]);

  type Row = {
    itemId: string;
    name: string;
    unit: string;
    qtyBought: number;
    amountSpent: number;
    qtyIssued: number;
    qtyUsed: number;
    remaining: number;
  };

  const rows = new Map<string, Row>();
  const remainingByItem = new Map(remainingAsOfMonthEnd.map((s) => [s.itemId, s.remaining]));

  const getRow = (itemId: string, name: string, unit: string): Row => {
    const existing = rows.get(itemId);
    if (existing) return existing;
    const fresh: Row = {
      itemId,
      name,
      unit,
      qtyBought: 0,
      amountSpent: 0,
      qtyIssued: 0,
      qtyUsed: 0,
      remaining: remainingByItem.get(itemId) ?? 0,
    };
    rows.set(itemId, fresh);
    return fresh;
  };

  for (const p of purchases) {
    const row = getRow(p.itemId, p.item.name, p.item.unit);
    row.qtyBought += Number(p.quantity);
    row.amountSpent += Number(p.totalCost);
  }
  for (const i of issuances) {
    const row = getRow(i.itemId, i.item.name, i.item.unit);
    row.qtyIssued += Number(i.quantity);
  }
  for (const u of usage) {
    const row = getRow(u.itemId, u.item.name, u.item.unit);
    row.qtyUsed += Number(u.quantity);
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
        <h2 className="text-lg font-semibold mb-3">{monthValue} - Bought, Issued, Used &amp; Remaining</h2>
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
                    <th>Qty Issued</th>
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
                        {r.qtyIssued} {r.unit}
                      </td>
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
