import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";
import { startOfDay, endOfDay, parseDateParam, toDateInputValue, formatMoney } from "@/lib/dates";

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const RECONCILIATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending manager review",
  CONFIRMED: "Confirmed",
  DISPUTED: "Disputed",
};

export default async function DailyReportPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  await requireRole(["MANAGER"]);

  const date = parseDateParam(searchParams.date);
  const range = { gte: startOfDay(date), lte: endOfDay(date) };

  const [purchases, issuances, usage, reconciliations] = await Promise.all([
    prisma.purchase.findMany({
      where: { date: range },
      include: { item: true, vendor: true },
      orderBy: { date: "asc" },
    }),
    prisma.issuance.findMany({
      where: { date: range },
      include: { item: true, recipient: true },
      orderBy: { date: "asc" },
    }),
    prisma.usage.findMany({ where: { date: range }, include: { item: true } }),
    prisma.dailyReconciliation.findMany({
      where: { date: range },
      include: { submittedBy: true, saleLines: { include: { menuItem: true } } },
      orderBy: { date: "asc" },
    }),
  ]);

  const usedByItem = new Map<string, { name: string; unit: string; qty: number }>();
  for (const u of usage) {
    const entry = usedByItem.get(u.itemId) ?? { name: u.item.name, unit: u.item.unit, qty: 0 };
    entry.qty += Number(u.quantity);
    usedByItem.set(u.itemId, entry);
  }

  const totalSpend = purchases.reduce((sum, p) => sum + Number(p.totalCost), 0);
  const dateValue = toDateInputValue(date);

  const dayCashTotal = reconciliations.reduce((sum, r) => sum + Number(r.cashTotal), 0);
  const dayTransferTotal = reconciliations.reduce((sum, r) => sum + Number(r.transferTotal), 0);
  const dayPosTotal = reconciliations.reduce((sum, r) => sum + Number(r.posTotal), 0);
  const daySalesTotal = dayCashTotal + dayTransferTotal + dayPosTotal;

  const soldByMenuItem = new Map<string, { name: string; category: string; qty: number }>();
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
        <h1 className="text-xl font-semibold">Daily Report</h1>
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
        <h2 className="text-lg font-semibold mb-3">Purchases - {dateValue}</h2>
        {purchases.length === 0 ? (
          <p className="text-sm text-stone-500">No purchases logged for this date.</p>
        ) : (
          <>
            <table className="table-base">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Cost</th>
                  <th>Purchased From</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p) => (
                  <tr key={p.id}>
                    <td>{p.item.name}</td>
                    <td>
                      {p.quantity.toString()} {p.item.unit}
                    </td>
                    <td>{formatMoney(Number(p.totalCost))}</td>
                    <td>{p.vendor.name}</td>
                    <td>{formatTime(p.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-sm font-medium mt-3">Total spend: {formatMoney(totalSpend)}</p>
          </>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Issuances - {dateValue}</h2>
        {issuances.length === 0 ? (
          <p className="text-sm text-stone-500">No issuances logged for this date.</p>
        ) : (
          <table className="table-base">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Issued To</th>
                <th>Team</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {issuances.map((i) => (
                <tr key={i.id}>
                  <td>{i.item.name}</td>
                  <td>
                    {i.quantity.toString()} {i.item.unit}
                  </td>
                  <td>{i.recipient.name}</td>
                  <td>{i.recipient.team}</td>
                  <td>{formatTime(i.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Items Used (Kitchen/Bar) - {dateValue}</h2>
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
        <h2 className="text-lg font-semibold mb-3">Sales Reconciliation - {dateValue}</h2>
        {reconciliations.length === 0 ? (
          <p className="text-sm text-stone-500">No reconciliation submitted for this date.</p>
        ) : (
          <div className="space-y-3">
            {reconciliations.map((r) => (
              <div key={r.id} className="text-sm space-y-1 border-b border-stone-100 pb-2 last:border-0">
                <p>
                  {formatTime(r.date)} - submitted by {r.submittedBy.name}
                </p>
                <p>
                  Cash: {formatMoney(Number(r.cashTotal))} - Transfer: {formatMoney(Number(r.transferTotal))} - POS:{" "}
                  {formatMoney(Number(r.posTotal))}
                </p>
                <p>Status: {RECONCILIATION_STATUS_LABELS[r.status]}</p>
                {r.notes && <p className="text-stone-500">Notes: {r.notes}</p>}
              </div>
            ))}
            <p className="text-sm font-medium">
              Cash: {formatMoney(dayCashTotal)} - Transfer: {formatMoney(dayTransferTotal)} - POS:{" "}
              {formatMoney(dayPosTotal)}
            </p>
            <p className="font-medium">Total Sales for the day: {formatMoney(daySalesTotal)}</p>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Sales by Item - {dateValue}</h2>
        {sortedSoldRows.length === 0 ? (
          <p className="text-sm text-stone-500">No sales logged for this date.</p>
        ) : (
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
        )}
      </div>
    </div>
  );
}
