import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";
import { computeStockLevels } from "@/lib/stock";
import StockTakeForm from "./StockTakeForm";

export default async function StockTakePage() {
  await requireRole(["STOREKEEPER", "MANAGER"]);

  const [items, stockLevels] = await Promise.all([
    prisma.item.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, name: true, category: true, unit: true },
    }),
    computeStockLevels(),
  ]);

  const stockByItem = new Map(stockLevels.map((s) => [s.itemId, s]));

  const rows = items.map((item) => {
    const stock = stockByItem.get(item.id);
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      systemQuantity: stock?.remaining ?? 0,
      lastCountDate: stock?.lastCountDate ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Stock Take</h1>
      <div className="card max-w-3xl">
        <p className="text-sm text-stone-600 mb-4">
          Count what&apos;s physically on the shelf and enter it below, item by item. Only the items you fill in
          are saved - leave the rest blank. Once saved, that count becomes the new starting point: purchases and
          issuances you log from now on will be added to or subtracted from it, so the &quot;On Hand&quot; numbers
          stay accurate going forward.
        </p>
        <StockTakeForm rows={rows} />
      </div>
    </div>
  );
}
