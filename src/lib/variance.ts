import { prisma } from "@/lib/db";

export type IngredientVariance = {
  itemId: string;
  name: string;
  unit: string;
  expectedUsage: number;
  actualUsage: number;
  variance: number;
};

/**
 * For a date range, compares expected ingredient usage (menu item sales x
 * recipe quantity per unit) against actual usage logged by kitchen/bar.
 * Only ingredients that are mapped into at least one recipe are included -
 * an item nobody has built a recipe for has no expected baseline to compare
 * against, so it's left out rather than showing a misleading 100% overage.
 */
export async function computeIngredientVariance(range: { gte: Date; lte: Date }): Promise<IngredientVariance[]> {
  const [saleLines, usageRows, recipeItems] = await Promise.all([
    prisma.saleLine.findMany({
      where: { reconciliation: { date: range } },
      select: { menuItemId: true, quantitySold: true },
    }),
    prisma.usage.findMany({
      where: { date: range },
      select: { itemId: true, quantity: true },
    }),
    prisma.recipeItem.findMany({ include: { item: true } }),
  ]);

  const soldByMenuItem = new Map<string, number>();
  for (const line of saleLines) {
    soldByMenuItem.set(line.menuItemId, (soldByMenuItem.get(line.menuItemId) ?? 0) + Number(line.quantitySold));
  }

  const actualByItem = new Map<string, number>();
  for (const u of usageRows) {
    actualByItem.set(u.itemId, (actualByItem.get(u.itemId) ?? 0) + Number(u.quantity));
  }

  const rowsByItem = new Map<string, IngredientVariance>();
  for (const r of recipeItems) {
    if (!rowsByItem.has(r.itemId)) {
      rowsByItem.set(r.itemId, {
        itemId: r.itemId,
        name: r.item.name,
        unit: r.item.unit,
        expectedUsage: 0,
        actualUsage: actualByItem.get(r.itemId) ?? 0,
        variance: 0,
      });
    }
    const soldQty = soldByMenuItem.get(r.menuItemId) ?? 0;
    const row = rowsByItem.get(r.itemId)!;
    row.expectedUsage += soldQty * Number(r.quantityPerUnit);
  }

  return Array.from(rowsByItem.values())
    .map((row) => ({ ...row, variance: row.actualUsage - row.expectedUsage }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
