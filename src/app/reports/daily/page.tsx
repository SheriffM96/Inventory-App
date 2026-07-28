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

  const [purchases, issuances, usage, reconciliation] = await Promise.all([
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
    prisma.dailyReconciliation.findUnique({
      where: { date: startOfDay(date) },
      include: { submittedBy: true, saleLines: { include: { menuItem: true } } },
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
        {!reconciliation ? (
          <p className="text-sm text-stone-500">No reconciliation submitted for this date.</p>
        ) : (
          <div className="text-sm space-y-1">
            <p>Submitted by {reconciliation.submittedBy.name}</p>
            <p>
              Cash: {formatMoney(Number(reconciliation.cashTotal))} - Transfer:{" "}
              {formatMoney(Number(reconciliation.transferTotal))} - POS: {formatMoney(Number(reconciliation.posTotal))}
            </p>
            <p className="font-medium">
              Total Sales:{" "}
              {formatMoney(
                Number(reconciliation.cashTotal) +
                  Number(reconciliation.transferTotal) +
                  Number(reconciliation.posTotal)
              )}
            </p>
            <p>Status: {RECONCILIATION_STATUS_LABELS[reconciliation.status]}</p>
            {reconciliation.notes && <p className="text-stone-500">Notes: {reconciliation.notes}</p>}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Sales by Item - {dateValue}</h2>
        {!reconciliation || reconciliation.saleLines.length === 0 ? (
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
              {[...reconciliation.saleLines]
                .sort((a, b) => a.menuItem.name.localeCompare(b.menuItem.name))
                .map((line) => (
                  <tr key={line.menuItemId}>
                    <td>{line.menuItem.name}</td>
                    <td className="text-stone-500">{line.menuItem.category}</td>
                    <td>{line.quantitySold.toString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
