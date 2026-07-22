import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { startOfDay, endOfDay, parseDateParam, toDateInputValue } from "@/lib/dates";

function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "MANAGER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dateParam = req.nextUrl.searchParams.get("date") ?? undefined;
  const date = parseDateParam(dateParam ?? undefined);
  const range = { gte: startOfDay(date), lte: endOfDay(date) };
  const dateValue = toDateInputValue(date);

  const [purchases, usage] = await Promise.all([
    prisma.purchase.findMany({ where: { date: range }, include: { item: true } }),
    prisma.usage.findMany({ where: { date: range }, include: { item: true } }),
  ]);

  const usedByItem = new Map<string, { name: string; unit: string; qty: number }>();
  for (const u of usage) {
    const entry = usedByItem.get(u.itemId) ?? { name: u.item.name, unit: u.item.unit, qty: 0 };
    entry.qty += Number(u.quantity);
    usedByItem.set(u.itemId, entry);
  }

  const purchasedByItem = new Map<string, { name: string; unit: string; qty: number; cost: number }>();
  for (const p of purchases) {
    const entry = purchasedByItem.get(p.itemId) ?? { name: p.item.name, unit: p.item.unit, qty: 0, cost: 0 };
    entry.qty += Number(p.quantity);
    entry.cost += p.totalCost ? Number(p.totalCost) : 0;
    purchasedByItem.set(p.itemId, entry);
  }

  const lines: string[] = [];
  lines.push(`Daily Consumption Report,${dateValue}`);
  lines.push("");
  lines.push("Section,Item,Quantity,Unit,Cost");
  for (const e of usedByItem.values()) {
    lines.push(["Used", csvEscape(e.name), e.qty, e.unit, ""].join(","));
  }
  for (const e of purchasedByItem.values()) {
    lines.push(["Purchased", csvEscape(e.name), e.qty, e.unit, e.cost.toFixed(2)].join(","));
  }

  const csv = lines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="daily-report-${dateValue}.csv"`,
    },
  });
}
