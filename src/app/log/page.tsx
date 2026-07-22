import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { startOfDay, endOfDay } from "@/lib/dates";
import PurchaseForm from "./PurchaseForm";
import UsageForm from "./UsageForm";

export default async function LogPage() {
  const session = await requireSession();
  const canLogPurchase = session.role === "STOREKEEPER" || session.role === "MANAGER";

  const items = await prisma.item.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, unit: true, category: true },
  });

  const today = new Date();
  const [todaysPurchases, todaysUsage] = await Promise.all([
    prisma.purchase.findMany({
      where: { date: { gte: startOfDay(today), lte: endOfDay(today) } },
      include: { item: true, loggedBy: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.usage.findMany({
      where: { date: { gte: startOfDay(today), lte: endOfDay(today) } },
      include: { item: true, loggedBy: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className={`grid gap-6 ${canLogPurchase ? "md:grid-cols-2" : ""}`}>
        {canLogPurchase && (
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Log a Purchase</h2>
            <PurchaseForm items={items} />
          </div>
        )}
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Log Usage / Items Given Out</h2>
          <UsageForm items={items} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Today&apos;s Purchases</h2>
          {todaysPurchases.length === 0 ? (
            <p className="text-sm text-stone-500">Nothing logged yet today.</p>
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {todaysPurchases.map((p) => (
                  <tr key={p.id}>
                    <td>{p.item.name}</td>
                    <td>
                      {p.quantity.toString()} {p.item.unit}
                    </td>
                    <td>{p.loggedBy.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Today&apos;s Usage</h2>
          {todaysUsage.length === 0 ? (
            <p className="text-sm text-stone-500">Nothing logged yet today.</p>
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>To</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {todaysUsage.map((u) => (
                  <tr key={u.id}>
                    <td>{u.item.name}</td>
                    <td>
                      {u.quantity.toString()} {u.item.unit}
                    </td>
                    <td>{u.department}</td>
                    <td>{u.loggedBy.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
