"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";
import { startOfDay } from "@/lib/dates";

export type ReconciliationFormState = { error?: string; success?: string };

function parseNonNegativeDecimal(value: FormDataEntryValue | null): number | null {
  if (value === null) return null;
  const text = String(value).trim();
  if (text === "") return null;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export async function submitReconciliationAction(
  _prev: ReconciliationFormState,
  formData: FormData
): Promise<ReconciliationFormState> {
  const session = await requireRole(["SUPERVISOR"]);

  const cashTotal = parseNonNegativeDecimal(formData.get("cashTotal"));
  const transferTotal = parseNonNegativeDecimal(formData.get("transferTotal"));
  const posTotal = parseNonNegativeDecimal(formData.get("posTotal"));
  const notes = String(formData.get("notes") || "").trim() || null;

  if (cashTotal === null || transferTotal === null || posTotal === null) {
    return { error: "Enter valid amounts (0 or more) for cash, transfer, and POS totals." };
  }

  const menuItems = await prisma.menuItem.findMany({ where: { active: true }, select: { id: true } });
  const saleLines: { menuItemId: string; quantitySold: number }[] = [];
  for (const menuItem of menuItems) {
    const raw = formData.get(`qty_${menuItem.id}`);
    if (raw === null) continue;
    const text = String(raw).trim();
    if (text === "") continue;
    const quantity = Number(text);
    if (!Number.isFinite(quantity) || quantity < 0) continue;
    saleLines.push({ menuItemId: menuItem.id, quantitySold: quantity });
  }

  const today = startOfDay(new Date());
  const existing = await prisma.dailyReconciliation.findUnique({ where: { date: today } });

  if (existing && existing.status !== "PENDING") {
    return {
      error: "Today's reconciliation has already been reviewed by the manager and can no longer be edited.",
    };
  }

  if (existing) {
    await prisma.$transaction([
      prisma.saleLine.deleteMany({ where: { reconciliationId: existing.id } }),
      prisma.dailyReconciliation.update({
        where: { id: existing.id },
        data: {
          cashTotal,
          transferTotal,
          posTotal,
          notes,
          submittedById: session.userId,
          saleLines: { createMany: { data: saleLines } },
        },
      }),
    ]);
  } else {
    await prisma.dailyReconciliation.create({
      data: {
        date: today,
        cashTotal,
        transferTotal,
        posTotal,
        notes,
        submittedById: session.userId,
        saleLines: { createMany: { data: saleLines } },
      },
    });
  }

  revalidatePath("/supervisor");
  revalidatePath("/dashboard");
  return { success: "Saved today's reconciliation. The manager will review it against the bank and cash." };
}
