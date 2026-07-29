import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { parseMonthParam, monthRange, toMonthInputValue } from "@/lib/dates";
import { computeStockLevels } from "@/lib/stock";
import { computeIngredientVariance } from "@/lib/variance";

function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const monthParam = req.nextUrl.searchParams.get("month") ?? undefined;
  const { year, month } = parseMonthParam(monthParam ?? undefined);
  const { start, end } = monthRange(year, month);
  const monthValue = toMonthInputValue(start);

  const [purchases, issuances, usage, remainingAsOfMonthEnd, reconciliations, ingredientVariance] = await Promise.all([
    prisma.purchase.findMany({ where: { date: { gte: start, lte: end } }, include: { item: true } }),
    prisma.issuance.findMany({ where: { date: { gte: start, lte: end } }, include: { item: true } }),
    prisma.usage.findMany({ where: { date: { gte: start, lte: end } }, include: { item: true } }),
    computeStockLevels(end),
    prisma.dailyReconciliation.findMany({
      where: { date: { gte: start, lte: end } },
      include: { saleLines: { include: { menuItem: true } } },
    }),
    computeIngredientVariance({ gte: start, lte: end }),
  ]);

  type Row = {
    name: string;
    unit: string;
    qtyBought: number;
    amountSpent: number;
    qtyIssued: number;
    qtyUsed: number;
    remaining: number;
  };

  const rows = new Map<string, Row>();
  const remainingByItem = new Map(remainingAsOfMonthEnd.map((s) => [s.itemId, s.remaining]));

  const getRow = (itemId: string, name: string, unit: string): Row => {
    const existing = rows.get(itemId);
    if (existing) return existing;
    const fresh: Row = {
      name,
      unit,
      qtyBought: 0,
      amountSpent: 0,
      qtyIssued: 0,
      qtyUsed: 0,
      remaining: remainingByItem.get(itemId) ?? 0,
    };
    rows.set(itemId, fresh);
    return fresh;
  };

  for (const p of purchases) {
    const row = getRow(p.itemId, p.item.name, p.item.unit);
    row.qtyBought += Number(p.quantity);
    row.amountSpent += Number(p.totalCost);
  }
  for (const i of issuances) {
    const row = getRow(i.itemId, i.item.name, i.item.unit);
    row.qtyIssued += Number(i.quantity);
  }
  for (const u of usage) {
    const row = getRow(u.itemId, u.item.name, u.item.unit);
    row.qtyUsed += Number(u.quantity);
  }

  const sortedRows = Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name));

  const lines: string[] = [];
  lines.push(`Monthly Report,${monthValue}`);
  lines.push("");
  lines.push("Item,Qty Bought,Amount Spent,Qty Issued,Qty Used,Qty Remaining (end of month),Unit");
  for (const r of sortedRows) {
    lines.push(
      [
        csvEscape(r.name),
        r.qtyBought,
        r.amountSpent.toFixed(2),
        r.qtyIssued,
        r.qtyUsed,
        r.remaining,
        r.unit,
      ].join(",")
    );
  }

  const monthCashTotal = reconciliations.reduce((sum, r) => sum + Number(r.cashTotal), 0);
  const monthTransferTotal = reconciliations.reduce((sum, r) => sum + Number(r.transferTotal), 0);
  const monthPosTotal = reconciliations.reduce((sum, r) => sum + Number(r.posTotal), 0);
  const monthSalesTotal = monthCashTotal + monthTransferTotal + monthPosTotal;

  const soldByMenuItem = new Map<string, { name: string; category: string; qty: number }>();
  for (const r of reconciliations) {
    for (const line of r.saleLines) {
      const existing = soldByMenuItem.get(line.menuItemId);
      if (existing) {
        existing.qty += Number(line.quantitySold);
      } else {
        soldByMenuItem.set(line.menuItemId, {
          name: line.menuItem.name,
          category: line.menuItem.category,
          qty: Number(line.quantitySold),
        });
      }
    }
  }
  const sortedSoldRows = Array.from(soldByMenuItem.values()).sort((a, b) => a.name.localeCompare(b.name));

  lines.push("");
  lines.push("Sales Reconciliation Summary");
  lines.push("Reconciliations Submitted,Cash,Transfer,POS,Total Sales");
  lines.push(
    [
      reconciliations.length,
      monthCashTotal.toFixed(2),
      monthTransferTotal.toFixed(2),
      monthPosTotal.toFixed(2),
      monthSalesTotal.toFixed(2),
    ].join(",")
  );
  lines.push("");
  lines.push("Sales by Item,Category,Quantity Sold");
  for (const r of sortedSoldRows) {
    lines.push([csvEscape(r.name), csvEscape(r.category), r.qty].join(","));
  }

  lines.push("");
  lines.push("Sales vs Usage Variance");
  if (ingredientVariance.length === 0) {
    lines.push("No ingredients have a recipe mapped yet.");
  } else {
    lines.push("Ingredient,Expected (from sales),Actual (logged),Variance,Unit");
    for (const v of ingredientVariance) {
      lines.push(
        [csvEscape(v.name), v.expectedUsage.toFixed(2), v.actualUsage.toFixed(2), v.variance.toFixed(2), v.unit].join(
          ","
        )
      );
    }
  }

  const csv = lines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="monthly-report-${monthValue}.csv"`,
    },
  });
}
