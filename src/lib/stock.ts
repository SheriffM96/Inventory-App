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
  reorderLevel: number | null;
  lowStock: boolean;
};

/**
 * Central (storekeeper) stock on hand per item, computed as:
 *   opening stock + all-time purchases - all-time issuances
 * Issuance (not Usage) is what leaves the central store - Usage is what
 * kitchen/bar staff do with stock after it's already been issued to them.
 * Pass `asOf` to compute the balance as of the end of a given date instead of "now".
 */
export async function computeStockLevels(asOf?: Date): Promise<StockLevel[]> {
  const dateFilter = asOf ? { lte: asOf } : undefined;

  const [items, purchaseSums, issuanceSums] = await Promise.all([
    prisma.item.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.purchase.groupBy({
      by: ["itemId"],
      _sum: { quantity: true },
      where: dateFilter ? { date: dateFilter } : undefined,
    }),
    prisma.issuance.groupBy({
      by: ["itemId"],
      _sum: { quantity: true },
      where: dateFilter ? { date: dateFilter } : undefined,
    }),
  ]);

  const purchasedMap = new Map(purchaseSums.map((p) => [p.itemId, Number(p._sum.quantity ?? 0)]));
  const issuedMap = new Map(issuanceSums.map((i) => [i.itemId, Number(i._sum.quantity ?? 0)]));

  return items.map((item) => {
    const totalPurchased = purchasedMap.get(item.id) ?? 0;
    const totalIssued = issuedMap.get(item.id) ?? 0;
    const opening = Number(item.openingStock);
    const remaining = opening + totalPurchased - totalIssued;
    const reorderLevel = item.reorderLevel !== null ? Number(item.reorderLevel) : null;
    return {
      itemId: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      openingStock: opening,
      totalPurchased,
      totalIssued,
      remaining,
      reorderLevel,
      lowStock: reorderLevel !== null && remaining <= reorderLevel,
    };
  });
}

export type DepartmentStockLevel = {
  itemId: string;
  name: string;
  category: string;
  unit: string;
  opening: number;
  received: number;
  used: number;
  closing: number;
};

/**
 * A department's (kitchen or bar) own stock reconciliation for a given day:
 *   opening balance (as of start of day) + received (issued to them today)
 *   - used (logged by them today) = closing balance
 */
export async function computeDepartmentStockLevels(
  team: "KITCHEN" | "BAR",
  day: Date
): Promise<DepartmentStockLevel[]> {
  const startOfDay = new Date(day);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(day);
  endOfDay.setHours(23, 59, 59, 999);

  const [items, receivedBeforeToday, usedBeforeToday, receivedToday, usedToday] = await Promise.all([
    prisma.item.findMany({ where: { active: true }, orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.issuance.groupBy({
      by: ["itemId"],
      _sum: { quantity: true },
      where: { date: { lt: startOfDay }, recipient: { team } },
    }),
    prisma.usage.groupBy({
      by: ["itemId"],
      _sum: { quantity: true },
      where: { date: { lt: startOfDay }, department: team },
    }),
    prisma.issuance.groupBy({
      by: ["itemId"],
      _sum: { quantity: true },
      where: { date: { gte: startOfDay, lte: endOfDay }, recipient: { team } },
    }),
    prisma.usage.groupBy({
      by: ["itemId"],
      _sum: { quantity: true },
      where: { date: { gte: startOfDay, lte: endOfDay }, department: team },
    }),
  ]);

  const toMap = (rows: { itemId: string; _sum: { quantity: unknown } }[]) =>
    new Map(rows.map((r) => [r.itemId, Number(r._sum.quantity ?? 0)]));

  const receivedBeforeMap = toMap(receivedBeforeToday);
  const usedBeforeMap = toMap(usedBeforeToday);
  const receivedTodayMap = toMap(receivedToday);
  const usedTodayMap = toMap(usedToday);

  return items.map((item) => {
    const opening = (receivedBeforeMap.get(item.id) ?? 0) - (usedBeforeMap.get(item.id) ?? 0);
    const received = receivedTodayMap.get(item.id) ?? 0;
    const used = usedTodayMap.get(item.id) ?? 0;
    return {
      itemId: item.id,
      name: item.name,
      category: item.category,
      unit: item.unit,
      opening,
      received,
      used,
      closing: opening + received - used,
    };
  });
}
