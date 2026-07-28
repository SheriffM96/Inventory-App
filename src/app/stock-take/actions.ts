"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";
import { notifyManager } from "@/lib/notify";

export type StockTakeFormState = { error?: string; success?: string };

function revalidateStockPaths() {
  revalidatePath("/stock-take");
  revalidatePath("/log");
  revalidatePath("/dashboard");
  revalidatePath("/reports/daily");
  revalidatePath("/reports/monthly");
}

export async function submitStockTakeAction(
  _prev: StockTakeFormState,
  formData: FormData
): Promise<StockTakeFormState> {
  const session = await requireRole(["STOREKEEPER", "MANAGER"]);

  const items = await prisma.item.findMany({ where: { active: true }, select: { id: true, name: true, unit: true } });
  const notes = String(formData.get("notes") || "").trim() || null;

  const rows: { itemId: string; quantity: number; name: string; unit: string }[] = [];
  for (const item of items) {
    const raw = formData.get(`qty_${item.id}`);
    if (raw === null) continue;
    const text = String(raw).trim();
    if (text === "") continue;
    const quantity = Number(text);
    if (!Number.isFinite(quantity) || quantity < 0) continue;
    rows.push({ itemId: item.id, quantity, name: item.name, unit: item.unit });
  }

  if (rows.length === 0) {
    return { error: "Enter a counted quantity for at least one item." };
  }

  await prisma.$transaction(
    rows.map((r) =>
      prisma.stockCount.create({
        data: { itemId: r.itemId, quantity: r.quantity, notes, loggedById: session.userId },
      })
    )
  );

  await notifyManager(
    "stock_take",
    `${session.name} recorded a stock take for ${rows.length} item(s): ${rows
      .map((r) => `${r.name} ${r.quantity}${r.unit}`)
      .join(", ")}`
  );

  revalidateStockPaths();
  return { success: `Saved stock take for ${rows.length} item(s). Future purchases and issuances will build on these counts.` };
}
