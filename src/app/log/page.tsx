import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { startOfDay, endOfDay } from "@/lib/dates";
import PurchaseForm from "./PurchaseForm";
import IssuanceForm from "./IssuanceForm";
import UsageForm from "./UsageForm";

export default async function LogPage() {
  const session = await requireSession();
  const isStorekeeper = session.role === "STOREKEEPER";
  const isKitchenOrBar = session.role === "KITCHEN" || session.role === "BAR";

  const [items, vendors, recipients] = await Promise.all([
    prisma.item.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, unit: true, category: true },
    }),
    isStorekeeper
      ? prisma.vendor.findMany({ where: { active: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
    isStorekeeper
      ? prisma.recipient.findMany({ where: { active: true }, orderBy: { name: "asc" } })
      : Promise.resolve([]),
  ]);

  const today = new Date();
  const [todaysPurchases, todaysIssuances, todaysUsage] = await Promise.all([
    isStorekeeper
      ? prisma.purchase.findMany({
          where: { date: { gte: startOfDay(today), lte: endOfDay(today) } },
          include: { item: true, vendor: true, loggedBy: true },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    isStorekeeper
      ? prisma.issuance.findMany({
          where: { date: { gte: startOfDay(today), lte: endOfDay(today) } },
          include: { item: true, recipient: true, loggedBy: true },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    isStorekeeper
      ? prisma.usage.findMany({
          where: { date: { gte: startOfDay(today), lte: endOfDay(today) } },
          include: { item: true, loggedBy: true },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      {isStorekeeper && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Log a Purchase</h2>
            <PurchaseForm items={items} vendors={vendors} />
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Log an Issuance</h2>
            <IssuanceForm items={items} recipients={recipients} />
          </div>
        </div>
      )}

      {isKitchenOrBar && (
        <div className="card max-w-lg">
          <h2 className="text-lg font-semibold mb-3">Log Usage</h2>
          <UsageForm items={items} />
        </div>
      )}

      {isStorekeeper && (
        <div className="grid gap-6 md:grid-cols-3">
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
                    <th>Vendor</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {todaysPurchases.map((p) => (
                    <tr key={p.id}>
                      <td>{p.item.name}</td>
                      <td>
                        {p.quantity.toString()} {p.item.unit}
                      </td>
                      <td>{p.vendor.name}</td>
                      <td>{new Date(p.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="card">
            <h2 className="text-lg font-semibold mb-3">Today&apos;s Issuances</h2>
            {todaysIssuances.length === 0 ? (
              <p className="text-sm text-stone-500">Nothing logged yet today.</p>
            ) : (
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>To</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {todaysIssuances.map((i) => (
                    <tr key={i.id}>
                      <td>{i.item.name}</td>
                      <td>
                        {i.quantity.toString()} {i.item.unit}
                      </td>
                      <td>{i.recipient.name}</td>
                      <td>{new Date(i.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
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
                    <th>By</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {todaysUsage.map((u) => (
                    <tr key={u.id}>
                      <td>{u.item.name}</td>
                      <td>
                        {u.quantity.toString()} {u.item.unit}
                      </td>
                      <td>{u.loggedBy.name}</td>
                      <td>{new Date(u.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
