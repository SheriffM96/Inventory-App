"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/require-session";
import { notifyManager } from "@/lib/notify";

export type LogFormState = { error?: string; success?: string };

function parsePositiveDecimal(value: FormDataEntryValue | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export async function logPurchaseAction(_prev: LogFormState, formData: FormData): Promise<LogFormState> {
  const session = await requireSession();
  if (session.role !== "STOREKEEPER" && session.role !== "MANAGER") {
    return { error: "You do not have permission to log purchases." };
  }

  const itemId = String(formData.get("itemId") || "");
  const quantity = parsePositiveDecimal(formData.get("quantity"));
  const unitPriceRaw = formData.get("unitPrice");
  const unitPrice = unitPriceRaw && String(unitPriceRaw).trim() !== "" ? Number(unitPriceRaw) : null;
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!itemId || quantity === null) {
    return { error: "Choose an item and enter a valid quantity." };
  }
  if (unitPrice !== null && (!Number.isFinite(unitPrice) || unitPrice < 0)) {
    return { error: "Unit price must be a positive number." };
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return { error: "Item not found." };

  const totalCost = unitPrice !== null ? unitPrice * quantity : null;

  await prisma.purchase.create({
    data: {
      itemId,
      quantity,
      unitPrice,
      totalCost,
      notes,
      loggedById: session.userId,
    },
  });

  await notifyManager(
    "purchase",
    `${session.name} logged a purchase: ${quantity} ${item.unit} of ${item.name}${
      totalCost !== null ? ` (cost: ${totalCost.toFixed(2)})` : ""
    }`
  );

  revalidatePath("/log");
  revalidatePath("/dashboard");
  return { success: `Logged purchase of ${quantity} ${item.unit} ${item.name}.` };
}

export async function logUsageAction(_prev: LogFormState, formData: FormData): Promise<LogFormState> {
  const session = await requireSession();

  const itemId = String(formData.get("itemId") || "");
  const quantity = parsePositiveDecimal(formData.get("quantity"));
  const department = String(formData.get("department") || "OTHER");
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!itemId || quantity === null) {
    return { error: "Choose an item and enter a valid quantity." };
  }
  if (!["KITCHEN", "BAR", "OTHER"].includes(department)) {
    return { error: "Invalid department." };
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return { error: "Item not found." };

  await prisma.usage.create({
    data: {
      itemId,
      quantity,
      department: department as "KITCHEN" | "BAR" | "OTHER",
      notes,
      loggedById: session.userId,
    },
  });

  await notifyManager(
    "usage",
    `${session.name} logged usage: ${quantity} ${item.unit} of ${item.name} issued to ${department}`
  );

  revalidatePath("/log");
  revalidatePath("/dashboard");
  return { success: `Logged usage of ${quantity} ${item.unit} ${item.name}.` };
}
