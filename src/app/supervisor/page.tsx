import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";
import { computeStockLevels } from "@/lib/stock";
import { startOfDay } from "@/lib/dates";
import ScrollableTable from "@/components/ScrollableTable";
import ReconciliationForm from "./ReconciliationForm";

export default async function SupervisorPage() {
  await requireRole(["SUPERVISOR"]);

  const today = startOfDay(new Date());

  const [stockLevels, menuItems, todaysReconciliation] = await Promise.all([
    computeStockLevels(),
    prisma.menuItem.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, name: true, category: true },
    }),
    prisma.dailyReconciliation.findUnique({
      where: { date: today },
      include: { saleLines: { include: { menuItem: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Supervisor</h1>

      <div className="card max-w-3xl">
        <h2 className="text-lg font-semibold mb-3">End of Day Reconciliation</h2>
        <ReconciliationForm menuItems={menuItems} existing={todaysReconciliation} />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Current Stock Levels</h2>
        <ScrollableTable>
          <table className="table-base">
            <thead>
              <tr>
                <th className="sticky top-0 bg-white z-10">Category</th>
                <th className="sticky top-0 bg-white z-10">Item</th>
                <th className="sticky top-0 bg-white z-10">On Hand</th>
              </tr>
            </thead>
            <tbody>
              {stockLevels.map((s) => (
                <tr key={s.itemId} className={s.lowStock ? "bg-amber-50" : undefined}>
                  <td className="text-stone-500">{s.category}</td>
                  <td>{s.name}</td>
                  <td className="font-medium">
                    {s.remaining} {s.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollableTable>
      </div>
    </div>
  );
}
