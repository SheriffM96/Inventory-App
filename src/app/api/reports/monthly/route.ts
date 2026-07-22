import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { parseMonthParam, monthRange, toMonthInputValue } from "@/lib/dates";
import { computeStockLevels } from "@/lib/stock";

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

  const [purchases, usage, remainingAsOfMonthEnd] = await Promise.all([
    prisma.purchase.findMany({ where: { date: { gte: start, lte: end } }, include: { item: true } }),
    prisma.usage.findMany({ where: { date: { gte: start, lte: end } }, include: { item: true } }),
    computeStockLevels(end),
  ]);

  type Row = {
    name: string;
    unit: string;
    qtyBought: number;
    amountSpent: number;
    qtyUsed: number;
    remaining: number;
  };

  const rows = new Map<string, Row>();
  const remainingByItem = new Map(remainingAsOfMonthEnd.map((s) => [s.itemId, s.remaining]));

  for (const p of purchases) {
    const row = rows.get(p.itemId) ?? {
      name: p.item.name,
      unit: p.item.unit,
      qtyBought: 0,
      amountSpent: 0,
      qtyUsed: 0,
      remaining: remainingByItem.get(p.itemId) ?? 0,
    };
    row.qtyBought += Number(p.quantity);
    row.amountSpent += p.totalCost ? Number(p.totalCost) : 0;
    rows.set(p.itemId, row);
  }

  for (const u of usage) {
    const row = rows.get(u.itemId) ?? {
      name: u.item.name,
      unit: u.item.unit,
      qtyBought: 0,
      amountSpent: 0,
      qtyUsed: 0,
      remaining: remainingByItem.get(u.itemId) ?? 0,
    };
    row.qtyUsed += Number(u.quantity);
    rows.set(u.itemId, row);
  }

  const sortedRows = Array.from(rows.values()).sort((a, b) => a.name.localeCompare(b.name));

  const lines: string[] = [];
  lines.push(`Monthly Report,${monthValue}`);
  lines.push("");
  lines.push("Item,Qty Bought,Amount Spent,Qty Used,Qty Remaining (end of month),Unit");
  for (const r of sortedRows) {
    lines.push(
      [csvEscape(r.name), r.qtyBought, r.amountSpent.toFixed(2), r.qtyUsed, r.remaining, r.unit].join(",")
    );
  }

  const csv = lines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="monthly-report-${monthValue}.csv"`,
    },
  });
}
