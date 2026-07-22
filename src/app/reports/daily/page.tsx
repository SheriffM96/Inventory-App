import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";
import { startOfDay, endOfDay, parseDateParam, toDateInputValue, formatMoney } from "@/lib/dates";

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default async function DailyReportPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  await requireRole(["MANAGER"]);

  const date = parseDateParam(searchParams.date);
  const range = { gte: startOfDay(date), lte: endOfDay(date) };

  const [purchases, issuances, usage] = await Promise.all([
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
    </div>
  );
}
