import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";
import { computeStockLevels } from "@/lib/stock";

export default async function DashboardPage() {
  await requireRole(["MANAGER"]);

  const [stockLevels, recentPurchases, recentUsage] = await Promise.all([
    computeStockLevels(),
    prisma.purchase.findMany({
      include: { item: true, loggedBy: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.usage.findMany({
      include: { item: true, loggedBy: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const lowStockItems = stockLevels.filter((s) => s.lowStock);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Manager Dashboard</h1>
        <div className="flex gap-2 text-sm">
          <Link href="/reports/daily" className="btn-secondary">
            Daily Report
          </Link>
          <Link href="/reports/monthly" className="btn-secondary">
            Monthly Report
          </Link>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="card border-amber-300 bg-amber-50">
          <h2 className="text-lg font-semibold mb-2 text-amber-800">Low Stock</h2>
          <ul className="text-sm text-amber-900 list-disc pl-5 space-y-1">
            {lowStockItems.map((s) => (
              <li key={s.itemId}>
                {s.name}: {s.remaining} {s.unit} left (reorder at {s.reorderLevel})
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Current Stock Levels</h2>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Category</th>
                <th>Item</th>
                <th>Purchased</th>
                <th>Used</th>
                <th>On Hand</th>
              </tr>
            </thead>
            <tbody>
              {stockLevels.map((s) => (
                <tr key={s.itemId} className={s.lowStock ? "bg-amber-50" : undefined}>
                  <td className="text-stone-500">{s.category}</td>
                  <td>{s.name}</td>
                  <td>
                    {s.totalPurchased} {s.unit}
                  </td>
                  <td>
                    {s.totalUsed} {s.unit}
                  </td>
                  <td className="font-medium">
                    {s.remaining} {s.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Recent Purchases</h2>
          <ul className="text-sm space-y-2">
            {recentPurchases.map((p) => (
              <li key={p.id} className="flex justify-between border-b border-stone-100 pb-2">
                <span>
                  {p.item.name} - {p.quantity.toString()} {p.item.unit}
                </span>
                <span className="text-stone-500">
                  {p.loggedBy.name}, {new Date(p.date).toLocaleDateString()}
                </span>
              </li>
            ))}
            {recentPurchases.length === 0 && <p className="text-stone-500">No purchases logged yet.</p>}
          </ul>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Recent Usage</h2>
          <ul className="text-sm space-y-2">
            {recentUsage.map((u) => (
              <li key={u.id} className="flex justify-between border-b border-stone-100 pb-2">
                <span>
                  {u.item.name} - {u.quantity.toString()} {u.item.unit} ({u.department})
                </span>
                <span className="text-stone-500">
                  {u.loggedBy.name}, {new Date(u.date).toLocaleDateString()}
                </span>
              </li>
            ))}
            {recentUsage.length === 0 && <p className="text-stone-500">No usage logged yet.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
}
