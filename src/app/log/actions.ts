"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireSession, requireRole } from "@/lib/require-session";
import { notifyManager } from "@/lib/notify";

function revalidateActivityPaths() {
  revalidatePath("/log");
  revalidatePath("/dashboard");
  revalidatePath("/reports/daily");
  revalidatePath("/reports/monthly");
}

export type LogFormState = { error?: string; success?: string };

function parsePositiveDecimal(value: FormDataEntryValue | null): number | null {
  if (value === null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export async function logPurchaseAction(_prev: LogFormState, formData: FormData): Promise<LogFormState> {
  const session = await requireSession();
  if (session.role !== "STOREKEEPER") {
    return { error: "Only the storekeeper can log purchases." };
  }

  const itemId = String(formData.get("itemId") || "");
  const quantity = parsePositiveDecimal(formData.get("quantity"));
  const totalCost = parsePositiveDecimal(formData.get("cost"));
  const vendorId = String(formData.get("vendorId") || "");
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!itemId || quantity === null) {
    return { error: "Choose an item and enter a valid quantity." };
  }
  if (totalCost === null) {
    return { error: "Cost is required." };
  }
  if (!vendorId) {
    return { error: "Choose a vendor." };
  }

  const [item, vendor] = await Promise.all([
    prisma.item.findUnique({ where: { id: itemId } }),
    prisma.vendor.findUnique({ where: { id: vendorId } }),
  ]);
  if (!item) return { error: "Item not found." };
  if (!vendor) return { error: "Vendor not found." };

  await prisma.purchase.create({
    data: {
      itemId,
      quantity,
      totalCost,
      vendorId,
      notes,
      loggedById: session.userId,
    },
  });

  await notifyManager(
    "purchase",
    `${session.name} logged a purchase: ${quantity} ${item.unit} of ${item.name} from ${vendor.name} (cost: ${totalCost.toFixed(2)})`
  );

  revalidateActivityPaths();
  return { success: `Logged purchase of ${quantity} ${item.unit} ${item.name} from ${vendor.name}.` };
}

export async function logIssuanceAction(_prev: LogFormState, formData: FormData): Promise<LogFormState> {
  const session = await requireSession();
  if (session.role !== "STOREKEEPER") {
    return { error: "Only the storekeeper can issue stock." };
  }

  const itemId = String(formData.get("itemId") || "");
  const quantity = parsePositiveDecimal(formData.get("quantity"));
  const recipientId = String(formData.get("recipientId") || "");
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!itemId || quantity === null) {
    return { error: "Choose an item and enter a valid quantity." };
  }
  if (!recipientId) {
    return { error: "Choose who you're issuing this to." };
  }

  const [item, recipient] = await Promise.all([
    prisma.item.findUnique({ where: { id: itemId } }),
    prisma.recipient.findUnique({ where: { id: recipientId } }),
  ]);
  if (!item) return { error: "Item not found." };
  if (!recipient) return { error: "Recipient not found." };

  await prisma.issuance.create({
    data: {
      itemId,
      quantity,
      recipientId,
      notes,
      loggedById: session.userId,
    },
  });

  await notifyManager(
    "issuance",
    `${session.name} issued ${quantity} ${item.unit} of ${item.name} to ${recipient.name} (${recipient.team})`
  );

  revalidateActivityPaths();
  return { success: `Issued ${quantity} ${item.unit} ${item.name} to ${recipient.name}.` };
}

export async function logUsageAction(_prev: LogFormState, formData: FormData): Promise<LogFormState> {
  const session = await requireSession();
  if (session.role !== "KITCHEN" && session.role !== "BAR") {
    return { error: "Only kitchen or bar staff log usage." };
  }

  const itemId = String(formData.get("itemId") || "");
  const quantity = parsePositiveDecimal(formData.get("quantity"));
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!itemId || quantity === null) {
    return { error: "Choose an item and enter a valid quantity." };
  }

  const item = await prisma.item.findUnique({ where: { id: itemId } });
  if (!item) return { error: "Item not found." };

  await prisma.usage.create({
    data: {
      itemId,
      quantity,
      department: session.role,
      notes,
      loggedById: session.userId,
    },
  });

  await notifyManager(
    "usage",
    `${session.name} logged usage: ${quantity} ${item.unit} of ${item.name} (${session.role})`
  );

  revalidateActivityPaths();
  return { success: `Logged usage of ${quantity} ${item.unit} ${item.name}.` };
}

export async function deletePurchaseAction(formData: FormData): Promise<void> {
  await requireRole(["MANAGER"]);
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.purchase.delete({ where: { id } }).catch(() => null);
  revalidateActivityPaths();
}

export async function deleteIssuanceAction(formData: FormData): Promise<void> {
  await requireRole(["MANAGER"]);
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.issuance.delete({ where: { id } }).catch(() => null);
  revalidateActivityPaths();
}

export async function deleteUsageAction(formData: FormData): Promise<void> {
  await requireRole(["MANAGER"]);
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.usage.delete({ where: { id } }).catch(() => null);
  revalidateActivityPaths();
}
