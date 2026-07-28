import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";
import { startOfDay } from "@/lib/dates";
import ReconciliationForm from "./ReconciliationForm";

export default async function SupervisorPage() {
  await requireRole(["SUPERVISOR"]);

  const today = startOfDay(new Date());

  const [menuItems, todaysReconciliation] = await Promise.all([
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
    </div>
  );
}
