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

function parseOccurredAt(value: FormDataEntryValue | null): Date {
  if (value) {
    const parsed = new Date(String(value));
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export async function logPurchaseAction(_prev: LogFormState, formData: FormData): Promise<LogFormState> {
  const session = await requireSession();
  if (session.role !== "STOREKEEPER") {
    return { error: "Only the storekeeper can log purchases." };
  }

  const itemId = String(formData.get("itemId") || "");
  const quantity = parsePositiveDecimal(formData.get("quantity"));
  const costRaw = formData.get("cost");
  const totalCost = costRaw && String(costRaw).trim() !== "" ? Number(costRaw) : null;
  const occurredAt = parseOccurredAt(formData.get("occurredAt"));
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!itemId || quantity === null) {
    return { error: "Choose an item and enter a valid quantity." };
  }
  if (totalCost !== null && (!Number.isFinite(totalCost) || totalCost < 0)) {
    return { error: "Cost must be a positive number." };
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return { error: "Item not found." };

  await prisma.purchase.create({
    data: {
      itemId,
      quantity,
      totalCost,
      date: occurredAt,
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
  revalidatePath("/reports/daily");
  revalidatePath("/reports/monthly");
  return { success: `Logged purchase of ${quantity} ${item.unit} ${item.name}.` };
}

export async function logUsageAction(_prev: LogFormState, formData: FormData): Promise<LogFormState> {
  const session = await requireSession();
  if (session.role !== "STOREKEEPER" && session.role !== "KITCHEN" && session.role !== "BAR") {
    return { error: "You do not have permission to log usage." };
  }

  const itemId = String(formData.get("itemId") || "");
  const quantity = parsePositiveDecimal(formData.get("quantity"));
  const occurredAt = parseOccurredAt(formData.get("occurredAt"));
  const notes = String(formData.get("notes") || "").trim() || null;

  // Kitchen/Bar staff can only log against their own department, regardless of
  // what the (hidden, disabled) form field says - only Storekeeper picks freely.
  let department: "KITCHEN" | "BAR" | "OTHER";
  if (session.role === "KITCHEN") {
    department = "KITCHEN";
  } else if (session.role === "BAR") {
    department = "BAR";
  } else {
    const submitted = String(formData.get("department") || "OTHER");
    if (!["KITCHEN", "BAR", "OTHER"].includes(submitted)) {
      return { error: "Invalid department." };
    }
    department = submitted as "KITCHEN" | "BAR" | "OTHER";
  }

  if (!itemId || quantity === null) {
    return { error: "Choose an item and enter a valid quantity." };
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return { error: "Item not found." };

  await prisma.usage.create({
    data: {
      itemId,
      quantity,
      department,
      date: occurredAt,
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
  revalidatePath("/reports/daily");
  revalidatePath("/reports/monthly");
  return { success: `Logged usage of ${quantity} ${item.unit} ${item.name}.` };
}
