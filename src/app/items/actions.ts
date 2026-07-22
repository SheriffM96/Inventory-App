"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";

export type ItemFormState = { error?: string; success?: string };

export async function createItemAction(_prev: ItemFormState, formData: FormData): Promise<ItemFormState> {
  await requireRole(["MANAGER"]);

  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const unit = String(formData.get("unit") || "").trim();
  const openingStockRaw = formData.get("openingStock");
  const reorderLevelRaw = formData.get("reorderLevel");

  if (!name || !category || !unit) {
    return { error: "Name, category, and unit are required." };
  }

  const openingStock = openingStockRaw && String(openingStockRaw).trim() !== "" ? Number(openingStockRaw) : 0;
  const reorderLevel =
    reorderLevelRaw && String(reorderLevelRaw).trim() !== "" ? Number(reorderLevelRaw) : null;

  const existing = await prisma.item.findUnique({ where: { name } });
  if (existing) {
    return { error: "An item with that name already exists." };
  }

  await prisma.item.create({
    data: { name, category, unit, openingStock, reorderLevel },
  });

  revalidatePath("/items");
  revalidatePath("/log");
  return { success: `Added ${name}.` };
}

export async function updateItemAction(formData: FormData): Promise<void> {
  await requireRole(["MANAGER"]);

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const unit = String(formData.get("unit") || "").trim();
  const reorderLevelRaw = formData.get("reorderLevel");
  const reorderLevel =
    reorderLevelRaw && String(reorderLevelRaw).trim() !== "" ? Number(reorderLevelRaw) : null;

  if (!id || !name || !category || !unit) return;

  await prisma.item.update({
    where: { id },
    data: { name, category, unit, reorderLevel },
  });

  revalidatePath("/items");
  revalidatePath("/log");
  revalidatePath("/dashboard");
}

export async function toggleItemActiveAction(formData: FormData): Promise<void> {
  await requireRole(["MANAGER"]);

  const id = String(formData.get("id") || "");
  const active = String(formData.get("active") || "") === "true";
  if (!id) return;

  await prisma.item.update({ where: { id }, data: { active: !active } });

  revalidatePath("/items");
  revalidatePath("/log");
}
