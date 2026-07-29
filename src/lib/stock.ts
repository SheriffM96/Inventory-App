import { prisma } from "@/lib/db";

export type StockLevel = {
  itemId: string;
  name: string;
  category: string;
  unit: string;
  openingStock: number;
  totalPurchased: number;
  totalIssued: number;
  remaining: number;
  totalUsed: number;
  balance: number;
  reorderLevel: number | null;
  lowStock: boolean;
  lastCountDate: Date | null;
};

/**
 * Central (storekeeper) stock on hand per item, computed as:
 *   baseline + purchases since baseline - issuances since baseline
 * The baseline is the item's most recent physical stock count (StockCount),
 * or - if it has never been counted - its original openingStock. This lets a
 * stock take reset the running balance to what's physically on the shelf
 * without losing history of purchases/issuances logged before the count.
 *
 * Also computes `balance` - what's currently sitting with kitchen/bar,
 * i.e. all-time issued minus all-time used. This is deliberately NOT
 * baseline-aware like `remaining` is: a stock count only recounts the
 * storekeeper's own shelf, not what kitchen/bar are still holding, so
 * resetting it there would make unconsumed issued stock vanish from the
 * balance. `remaining` ("On Hand") is what's in the store; `balance` is
 * what's in the kitchen/bar.
 *
 * Pass `asOf` to compute the balance as of the end of a given date instead of "now".
 */
export async function computeStockLevels(asOf?: Date): Promise<StockLevel[]> {
  const dateFilter = asOf ? { lte: asOf } : undefined;

  const [items, purchases, issuances, usage, stockCounts] = await Promise.all([
    prisma.item.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.purchase.findMany({
      where: dateFilter ? { date: dateFilter } : undefined,
      select: { itemId: true, quantity: true, date: true },
    }),
    prisma.issuance.findMany({
      where: dateFilter ? { date: dateFilter } : undefined,
      select: { itemId: true, quantity: true, date: true },
    }),
    prisma.usage.findMany({
      where: dateFilter ? { date: dateFilter } : undefined,
      select: { itemId: true, quantity: true },
    }),
    prisma.stockCount.findMany({
      where: dateFilter ? { date: dateFilter } : undefined,
      orderBy: { date: "desc" },
      select: { itemId: true, quantity: true, date: true },
    }),
  ]);

  const latestCountByItem = new Map<string, { quantity: number; date: Date }>();
  for (const count of stockCounts) {
    if (!latestCountByItem.has(count.itemId)) {
      latestCountByItem.set(count.itemId, { quantity: Number(count.quantity), date: count.date });
    }
  }

  return items.map((item) => {
    const latestCount = latestCountByItem.get(item.id);
    const baseline = latestCount ? latestCount.quantity : Number(item.openingStock);
    const baselineDate = latestCount?.date ?? null;

    const itemPurchases = purchases.filter((p) => p.itemId === item.id);
    const itemIssuances = issuances.filter((i) => i.itemId === item.id);
    const itemUsage = usage.filter((u) => u.itemId === item.id);

    const totalPurchased = itemPurchases
      .filter((p) => !baselineDate || p.date > baselineDate)
      .reduce((sum, p) => sum + Number(p.quantity), 0);
    const totalIssued = itemIssuances
      .filter((i) => !baselineDate || i.date > baselineDate)
      .reduce((sum, i) => sum + Number(i.quantity), 0);

    const allTimeIssued = itemIssuances.reduce((sum, i) => sum + Number(i.quantity), 0);
    const totalUsed = itemUsage.reduce((sum, u) => sum + Number(u.quantity), 0);
    const balance = allTimeIssued - totalUsed;

    const remaining = baseline + totalPurchased - totalIssued;
    const reorderLevel = item.reorderLevel !== null ? Number(item.reorderLevel) : null;
    return {
      itemId: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      openingStock: baseline,
      totalPurchased,
      totalIssued,
      remaining,
      totalUsed,
      balance,
      reorderLevel,
      lowStock: reorderLevel !== null && remaining <= reorderLevel,
      lastCountDate: baselineDate,
    };
  });
}
