import { prisma } from "@/lib/db";

export type StockLevel = {
  itemId: string;
  name: string;
  category: string;
  unit: string;
  openingStock: number;
  totalPurchased: number;
  totalUsed: number;
  remaining: number;
  reorderLevel: number | null;
  lowStock: boolean;
};

/**
 * Current on-hand stock per item, computed as:
 *   opening stock + all-time purchases - all-time usage
 * Pass `asOf` to compute the balance as of the end of a given date instead of "now".
 */
export async function computeStockLevels(asOf?: Date): Promise<StockLevel[]> {
  const dateFilter = asOf ? { lte: asOf } : undefined;

  const [items, purchaseSums, usageSums] = await Promise.all([
    prisma.item.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.purchase.groupBy({
      by: ["itemId"],
      _sum: { quantity: true },
      where: dateFilter ? { date: dateFilter } : undefined,
    }),
    prisma.usage.groupBy({
      by: ["itemId"],
      _sum: { quantity: true },
      where: dateFilter ? { date: dateFilter } : undefined,
    }),
  ]);

  const purchasedMap = new Map(purchaseSums.map((p) => [p.itemId, Number(p._sum.quantity ?? 0)]));
  const usedMap = new Map(usageSums.map((u) => [u.itemId, Number(u._sum.quantity ?? 0)]));

  return items.map((item) => {
    const totalPurchased = purchasedMap.get(item.id) ?? 0;
    const totalUsed = usedMap.get(item.id) ?? 0;
    const opening = Number(item.openingStock);
    const remaining = opening + totalPurchased - totalUsed;
    const reorderLevel = item.reorderLevel !== null ? Number(item.reorderLevel) : null;
    return {
      itemId: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      openingStock: opening,
      totalPurchased,
      totalUsed,
      remaining,
      reorderLevel,
      lowStock: reorderLevel !== null && remaining <= reorderLevel,
    };
  });
}
