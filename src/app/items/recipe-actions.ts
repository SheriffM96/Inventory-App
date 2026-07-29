"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";

export type RecipeFormState = { error?: string; success?: string };

export async function addRecipeItemAction(
  _prev: RecipeFormState,
  formData: FormData
): Promise<RecipeFormState> {
  await requireRole(["MANAGER"]);

  const menuItemId = String(formData.get("menuItemId") || "");
  const itemId = String(formData.get("itemId") || "");
  const quantityRaw = formData.get("quantityPerUnit");
  const quantityPerUnit = quantityRaw !== null ? Number(quantityRaw) : NaN;

  if (!menuItemId || !itemId) {
    return { error: "Choose an ingredient." };
  }
  if (!Number.isFinite(quantityPerUnit) || quantityPerUnit <= 0) {
    return { error: "Enter a quantity greater than 0." };
  }

  const [menuItem, item] = await Promise.all([
    prisma.menuItem.findUnique({ where: { id: menuItemId } }),
    prisma.item.findUnique({ where: { id: itemId } }),
  ]);
  if (!menuItem) return { error: "Menu item not found." };
  if (!item) return { error: "Ingredient item not found." };

  const existing = await prisma.recipeItem.findUnique({
    where: { menuItemId_itemId: { menuItemId, itemId } },
  });
  if (existing) {
    return { error: `${item.name} is already in this recipe - remove it first to change the quantity.` };
  }

  await prisma.recipeItem.create({ data: { menuItemId, itemId, quantityPerUnit } });

  revalidatePath(`/items/recipes/${menuItemId}`);
  return { success: `Added ${item.name} to the recipe.` };
}

export async function removeRecipeItemAction(formData: FormData): Promise<void> {
  await requireRole(["MANAGER"]);

  const id = String(formData.get("id") || "");
  if (!id) return;

  const existing = await prisma.recipeItem.findUnique({ where: { id } });
  if (!existing) return;

  await prisma.recipeItem.delete({ where: { id } }).catch(() => null);

  revalidatePath(`/items/recipes/${existing.menuItemId}`);
}
