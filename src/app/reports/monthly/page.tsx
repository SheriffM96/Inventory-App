import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";
import { parseMonthParam, monthRange, toMonthInputValue, formatMoney } from "@/lib/dates";
import { computeStockLevels } from "@/lib/stock";
import { computeIngredientVariance } from "@/lib/variance";

export default async function MonthlyReportPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  await requireRole(["MANAGER"]);

  const { year, month } = parseMonthParam(searchParams.month);
  const { start, end } = monthRange(year, month);
  const monthValue = toMonthInputValue(start);

  const [purchases, issuances, usage, remainingAsOfMonthEnd, reconciliations, ingredientVariance] = await Promise.all([
    prisma.purchase.findMany({ where: { date: { gte: start, lte: end } }, include: { item: true } }),
    prisma.issuance.findMany({ where: { date: { gte: start, lte: end } }, include: { item: true } }),
    prisma.usage.findMany({ where: { date: { gte: start, lte: end } }, include: { item: true } }),
    computeStockLevels(end),
    prisma.dailyReconciliation.findMany({
      where: { date: { gte: start, lte: end } },
      include: { saleLines: { include: { menuItem: true } } },
    }),
    computeIngredientVariance({ gte: start, lte: end }),
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

  const monthCashTotal = reconciliations.reduce((sum, r) => sum + Number(r.cashTotal), 0);
  const monthTransferTotal = reconciliations.reduce((sum, r) => sum + Number(r.transferTotal), 0);
  const monthPosTotal = reconciliations.reduce((sum, r) => sum + Number(r.posTotal), 0);
  const monthSalesTotal = monthCashTotal + monthTransferTotal + monthPosTotal;

  type SoldRow = { name: string; category: string; qty: number };
  const soldByMenuItem = new Map<string, SoldRow>();
  for (const r of reconciliations) {
    for (const line of r.saleLines) {
      const existing = soldByMenuItem.get(line.menuItemId);
      if (existing) {
        existing.qty += Number(line.quantitySold);
      } else {
        soldByMenuItem.set(line.menuItemId, {
          name: line.menuItem.name,
          category: line.menuItem.category,
          qty: Number(line.quantitySold),
        });
      }
    }
  }
  const sortedSoldRows = Array.from(soldByMenuItem.values()).sort((a, b) => a.name.localeCompare(b.name));

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

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Sales Reconciliation Summary - {monthValue}</h2>
        {reconciliations.length === 0 ? (
          <p className="text-sm text-stone-500">No reconciliations submitted this month.</p>
        ) : (
          <div className="text-sm space-y-1">
            <p>Reconciliations submitted: {reconciliations.length}</p>
            <p>
              Cash: {formatMoney(monthCashTotal)} - Transfer: {formatMoney(monthTransferTotal)} - POS:{" "}
              {formatMoney(monthPosTotal)}
            </p>
            <p className="font-medium">Total Sales this month: {formatMoney(monthSalesTotal)}</p>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Sales by Item - {monthValue}</h2>
        {sortedSoldRows.length === 0 ? (
          <p className="text-sm text-stone-500">No sales logged this month.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Quantity Sold</th>
                </tr>
              </thead>
              <tbody>
                {sortedSoldRows.map((r) => (
                  <tr key={r.name}>
                    <td>{r.name}</td>
                    <td className="text-stone-500">{r.category}</td>
                    <td>{r.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Sales vs Usage Variance - {monthValue}</h2>
        <p className="text-sm text-stone-600 mb-3">
          Expected usage comes from menu item sales x recipe (Items &amp; Vendors &rarr; Menu Items &rarr; Recipe).
          Actual usage is what kitchen/bar logged. A positive variance means more was used than the sales explain.
        </p>
        {ingredientVariance.length === 0 ? (
          <p className="text-sm text-stone-500">
            No ingredients have a recipe mapped yet - set one up under Items &amp; Vendors to see this comparison.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Ingredient</th>
                  <th>Expected (from sales)</th>
                  <th>Actual (logged)</th>
                  <th>Variance</th>
                </tr>
              </thead>
              <tbody>
                {ingredientVariance.map((v) => (
                  <tr key={v.itemId} className={Math.abs(v.variance) > 0.01 ? "bg-amber-50" : undefined}>
                    <td>{v.name}</td>
                    <td>
                      {v.expectedUsage.toFixed(2)} {v.unit}
                    </td>
                    <td>
                      {v.actualUsage.toFixed(2)} {v.unit}
                    </td>
                    <td className="font-medium">
                      {v.variance > 0 ? "+" : ""}
                      {v.variance.toFixed(2)} {v.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
