import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";
import { startOfDay, endOfDay, formatMoney } from "@/lib/dates";
import ReconciliationForm from "./ReconciliationForm";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 border-amber-300 text-amber-800",
  CONFIRMED: "bg-green-50 border-green-300 text-green-800",
  DISPUTED: "bg-red-50 border-red-300 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending manager review",
  CONFIRMED: "Confirmed",
  DISPUTED: "Disputed",
};

export default async function SupervisorPage() {
  await requireRole(["SUPERVISOR"]);

  const today = new Date();

  const [menuItems, todaysReconciliations] = await Promise.all([
    prisma.menuItem.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, name: true, category: true },
    }),
    prisma.dailyReconciliation.findMany({
      where: { date: { gte: startOfDay(today), lte: endOfDay(today) } },
      include: { saleLines: { include: { menuItem: true } } },
      orderBy: { date: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Supervisor</h1>

      <div className="card max-w-3xl">
        <h2 className="text-lg font-semibold mb-3">Submit a Reconciliation</h2>
        <p className="text-sm text-stone-600 mb-4">
          You can submit more than one of these in a day - e.g. one per shift.
        </p>
        <ReconciliationForm menuItems={menuItems} />
      </div>

      <div className="card max-w-3xl">
        <h2 className="text-lg font-semibold mb-3">Today&apos;s Submissions</h2>
        {todaysReconciliations.length === 0 ? (
          <p className="text-sm text-stone-500">Nothing submitted yet today.</p>
        ) : (
          <div className="space-y-3">
            {todaysReconciliations.map((r) => {
              const total = Number(r.cashTotal) + Number(r.transferTotal) + Number(r.posTotal);
              return (
                <div key={r.id} className={`border rounded-md p-3 text-sm ${STATUS_STYLES[r.status]}`}>
                  <p className="font-medium">
                    {new Date(r.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                    {STATUS_LABELS[r.status]}
                  </p>
                  <p>
                    Cash: {formatMoney(Number(r.cashTotal))} - Transfer: {formatMoney(Number(r.transferTotal))} -
                    POS: {formatMoney(Number(r.posTotal))} - Total: {formatMoney(total)}
                  </p>
                  {r.notes && <p>Note: {r.notes}</p>}
                  {r.managerNotes && <p>Manager note: {r.managerNotes}</p>}
                  {r.saleLines.length > 0 && (
                    <p>
                      Sold: {r.saleLines.map((l) => `${l.menuItem.name}: ${l.quantitySold.toString()}`).join(", ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
