"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";

export type MenuItemFormState = { error?: string; success?: string };

export async function createMenuItemAction(
  _prev: MenuItemFormState,
  formData: FormData
): Promise<MenuItemFormState> {
  await requireRole(["MANAGER"]);

  const name = String(formData.get("name") || "").trim();
  const category = String(formData.get("category") || "").trim();

  if (!name || !category) {
    return { error: "Name and category are required." };
  }

  const existing = await prisma.menuItem.findUnique({ where: { name } });
  if (existing) return { error: "A menu item with that name already exists." };

  await prisma.menuItem.create({ data: { name, category } });
  revalidatePath("/items");
  revalidatePath("/supervisor");
  return { success: `Added menu item ${name}.` };
}

export async function toggleMenuItemActiveAction(formData: FormData): Promise<void> {
  await requireRole(["MANAGER"]);

  const id = String(formData.get("id") || "");
  const active = String(formData.get("active") || "") === "true";
  if (!id) return;

  await prisma.menuItem.update({ where: { id }, data: { active: !active } });
  revalidatePath("/items");
  revalidatePath("/supervisor");
}
