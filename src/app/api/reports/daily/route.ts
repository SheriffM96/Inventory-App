import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import { startOfDay, endOfDay, parseDateParam, toDateInputValue } from "@/lib/dates";

function csvEscape(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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

  const [purchases, issuances, usage, reconciliation] = await Promise.all([
    prisma.purchase.findMany({ where: { date: range }, include: { item: true, vendor: true }, orderBy: { date: "asc" } }),
    prisma.issuance.findMany({
      where: { date: range },
      include: { item: true, recipient: true },
      orderBy: { date: "asc" },
    }),
    prisma.usage.findMany({ where: { date: range }, include: { item: true } }),
    prisma.dailyReconciliation.findUnique({
      where: { date: startOfDay(date) },
      include: { submittedBy: true, saleLines: { include: { menuItem: true } } },
    }),
  ]);

  const usedByItem = new Map<string, { name: string; unit: string; qty: number }>();
  for (const u of usage) {
    const entry = usedByItem.get(u.itemId) ?? { name: u.item.name, unit: u.item.unit, qty: 0 };
    entry.qty += Number(u.quantity);
    usedByItem.set(u.itemId, entry);
  }

  const lines: string[] = [];
  lines.push(`Daily Report,${dateValue}`);
  lines.push("");
  lines.push("Section,Item,Quantity,Unit,Cost,Vendor/Recipient,Team,Time");
  for (const p of purchases) {
    lines.push(
      [
        "Purchased",
        csvEscape(p.item.name),
        p.quantity.toString(),
        p.item.unit,
        Number(p.totalCost).toFixed(2),
        csvEscape(p.vendor.name),
        "",
        formatTime(p.date),
      ].join(",")
    );
  }
  for (const i of issuances) {
    lines.push(
      [
        "Issued",
        csvEscape(i.item.name),
        i.quantity.toString(),
        i.item.unit,
        "",
        csvEscape(i.recipient.name),
        i.recipient.team,
        formatTime(i.date),
      ].join(",")
    );
  }
  for (const e of usedByItem.values()) {
    lines.push(["Used", csvEscape(e.name), e.qty, e.unit, "", "", "", ""].join(","));
  }

  lines.push("");
  lines.push("Sales Reconciliation");
  if (reconciliation) {
    const total =
      Number(reconciliation.cashTotal) + Number(reconciliation.transferTotal) + Number(reconciliation.posTotal);
    lines.push("Submitted By,Cash,Transfer,POS,Total Sales,Status,Notes");
    lines.push(
      [
        csvEscape(reconciliation.submittedBy.name),
        Number(reconciliation.cashTotal).toFixed(2),
        Number(reconciliation.transferTotal).toFixed(2),
        Number(reconciliation.posTotal).toFixed(2),
        total.toFixed(2),
        reconciliation.status,
        csvEscape(reconciliation.notes ?? ""),
      ].join(",")
    );
    lines.push("");
    lines.push("Sales by Item,Category,Quantity Sold");
    for (const line of reconciliation.saleLines) {
      lines.push([csvEscape(line.menuItem.name), csvEscape(line.menuItem.category), line.quantitySold.toString()].join(","));
    }
  } else {
    lines.push("No reconciliation submitted for this date.");
  }

  const csv = lines.join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="daily-report-${dateValue}.csv"`,
    },
  });
}
