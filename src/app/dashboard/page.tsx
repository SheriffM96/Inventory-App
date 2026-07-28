import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";
import { computeStockLevels } from "@/lib/stock";
import { formatMoney } from "@/lib/dates";
import ConfirmDeleteForm from "@/components/ConfirmDeleteForm";
import { deletePurchaseAction, deleteIssuanceAction, deleteUsageAction } from "@/app/log/actions";
import { confirmReconciliationAction, disputeReconciliationAction } from "./reconciliation-actions";

const RECONCILIATION_STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 border-amber-300 text-amber-800",
  CONFIRMED: "bg-green-50 border-green-300 text-green-800",
  DISPUTED: "bg-red-50 border-red-300 text-red-800",
};

function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  await requireRole(["MANAGER"]);

  const [stockLevels, recentPurchases, recentIssuances, recentUsage, purchaseTotal, reconciliations] =
    await Promise.all([
      computeStockLevels(),
      prisma.purchase.findMany({
        include: { item: true, vendor: true, loggedBy: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.issuance.findMany({
        include: { item: true, recipient: true, loggedBy: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.usage.findMany({
        include: { item: true, loggedBy: true },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.purchase.aggregate({ _sum: { totalCost: true } }),
      prisma.dailyReconciliation.findMany({
        include: {
          submittedBy: true,
          reviewedBy: true,
          saleLines: { include: { menuItem: true } },
        },
        orderBy: { date: "desc" },
        take: 14,
      }),
    ]);

  const lowStockItems = stockLevels.filter((s) => s.lowStock);
  const categories = Array.from(new Set(stockLevels.map((s) => s.category))).sort();
  const selectedCategory = searchParams.category ?? "";
  const visibleStockLevels = selectedCategory
    ? stockLevels.filter((s) => s.category === selectedCategory)
    : stockLevels;
  const totalPurchaseAmount = Number(purchaseTotal._sum.totalCost ?? 0);

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

      <div className="card">
        <p className="text-sm text-stone-500">Total Purchases (all time)</p>
        <p className="text-2xl font-semibold text-brand-700">{formatMoney(totalPurchaseAmount)}</p>
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
        <h2 className="text-lg font-semibold mb-3">End of Day Reconciliations</h2>
        <div className="space-y-3">
          {reconciliations.map((r) => {
            const saleSummary = r.saleLines
              .map((line) => `${line.menuItem.name}: ${line.quantitySold.toString()}`)
              .join(", ");
            return (
              <div key={r.id} className={`border rounded-md p-3 ${RECONCILIATION_STATUS_STYLES[r.status]}`}>
                <div className="flex flex-wrap justify-between gap-2 text-sm">
                  <div>
                    <p className="font-medium">
                      {new Date(r.date).toLocaleDateString(undefined, {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                      })}{" "}
                      - submitted by {r.submittedBy.name}
                    </p>
                    <p>
                      Cash: {formatMoney(Number(r.cashTotal))} - Transfer: {formatMoney(Number(r.transferTotal))} -
                      POS: {formatMoney(Number(r.posTotal))}
                    </p>
                    {r.notes && <p className="text-stone-600">Note: {r.notes}</p>}
                    {saleSummary && <p className="text-stone-600">Sold: {saleSummary}</p>}
                    {r.status !== "PENDING" && (
                      <p className="text-stone-600">
                        {r.status === "CONFIRMED" ? "Confirmed" : "Disputed"} by {r.reviewedBy?.name} on{" "}
                        {r.reviewedAt ? formatDateTime(r.reviewedAt) : ""}
                        {r.managerNotes && <> - {r.managerNotes}</>}
                      </p>
                    )}
                  </div>
                  {r.status === "PENDING" && (
                    <form action={confirmReconciliationAction} className="flex flex-col gap-2 items-end">
                      <input type="hidden" name="id" value={r.id} />
                      <input
                        name="managerNotes"
                        type="text"
                        placeholder="Note (optional)"
                        className="input text-xs py-1"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          formAction={confirmReconciliationAction}
                          className="btn-secondary py-1 px-2 text-xs"
                        >
                          Confirm
                        </button>
                        <button
                          type="submit"
                          formAction={disputeReconciliationAction}
                          className="btn-secondary py-1 px-2 text-xs"
                        >
                          Dispute
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
          {reconciliations.length === 0 && (
            <p className="text-sm text-stone-500">No reconciliations submitted yet.</p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <h2 className="text-lg font-semibold">Current Stock Levels</h2>
          <form method="GET" className="flex items-center gap-2">
            <select name="category" defaultValue={selectedCategory} className="input">
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-secondary">
              Filter
            </button>
          </form>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Category</th>
                <th>Item</th>
                <th>Purchased</th>
                <th>Issued</th>
                <th>On Hand</th>
              </tr>
            </thead>
            <tbody>
              {visibleStockLevels.map((s) => (
                <tr key={s.itemId} className={s.lowStock ? "bg-amber-50" : undefined}>
                  <td className="text-stone-500">{s.category}</td>
                  <td>{s.name}</td>
                  <td>
                    {s.totalPurchased} {s.unit}
                  </td>
                  <td>
                    {s.totalIssued} {s.unit}
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
              <li key={p.id} className="flex justify-between border-b border-stone-100 pb-2 gap-2">
                <span>
                  {p.item.name} - {p.quantity.toString()} {p.item.unit}
                  <span className="text-stone-500"> from {p.vendor.name}</span>
                  <br />
                  <span className="text-stone-500">{formatMoney(Number(p.totalCost))}</span>
                </span>
                <span className="text-stone-500 whitespace-nowrap text-right">
                  {p.loggedBy.name}
                  <br />
                  {formatDateTime(p.date)}
                  <br />
                  <ConfirmDeleteForm
                    action={deletePurchaseAction}
                    id={p.id}
                    confirmMessage={`Delete this purchase of ${p.quantity.toString()} ${p.item.unit} ${p.item.name}? This cannot be undone.`}
                  />
                </span>
              </li>
            ))}
            {recentPurchases.length === 0 && <p className="text-stone-500">No purchases logged yet.</p>}
          </ul>
        </div>
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Recent Issuances</h2>
          <ul className="text-sm space-y-2">
            {recentIssuances.map((i) => (
              <li key={i.id} className="flex justify-between border-b border-stone-100 pb-2 gap-2">
                <span>
                  {i.item.name} - {i.quantity.toString()} {i.item.unit}
                  <span className="text-stone-500">
                    {" "}
                    to {i.recipient.name} ({i.recipient.team})
                  </span>
                </span>
                <span className="text-stone-500 whitespace-nowrap text-right">
                  {i.loggedBy.name}
                  <br />
                  {formatDateTime(i.date)}
                  <br />
                  <ConfirmDeleteForm
                    action={deleteIssuanceAction}
                    id={i.id}
                    confirmMessage={`Delete this issuance of ${i.quantity.toString()} ${i.item.unit} ${i.item.name} to ${i.recipient.name}? This cannot be undone.`}
                  />
                </span>
              </li>
            ))}
            {recentIssuances.length === 0 && <p className="text-stone-500">No issuances logged yet.</p>}
          </ul>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Recent Usage</h2>
        <ul className="text-sm space-y-2">
          {recentUsage.map((u) => (
            <li key={u.id} className="flex justify-between border-b border-stone-100 pb-2 gap-2">
              <span>
                {u.item.name} - {u.quantity.toString()} {u.item.unit} ({u.department})
              </span>
              <span className="text-stone-500 whitespace-nowrap text-right">
                {u.loggedBy.name}
                <br />
                {formatDateTime(u.date)}
                <br />
                <ConfirmDeleteForm
                  action={deleteUsageAction}
                  id={u.id}
                  confirmMessage={`Delete this usage of ${u.quantity.toString()} ${u.item.unit} ${u.item.name}? This cannot be undone.`}
                />
              </span>
            </li>
          ))}
          {recentUsage.length === 0 && <p className="text-stone-500">No usage logged yet.</p>}
        </ul>
      </div>
    </div>
  );
}
