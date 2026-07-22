"use server";

import ExcelJS from "exceljs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";
import { UNITS } from "@/lib/units";

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
  if (!(UNITS as readonly string[]).includes(unit)) {
    return { error: "Choose a valid unit." };
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
  if (!(UNITS as readonly string[]).includes(unit)) return;

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

export async function importItemsAction(_prev: ItemFormState, formData: FormData): Promise<ItemFormState> {
  await requireRole(["MANAGER"]);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an Excel (.xlsx) file to upload." };
  }

  let workbook: ExcelJS.Workbook;
  try {
    const buffer = await file.arrayBuffer();
    workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  } catch {
    return { error: "Could not read that file. Make sure it's a valid .xlsx spreadsheet." };
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return { error: "The file has no worksheets." };
  }

  const headerRow = worksheet.getRow(1);
  const headerMap = new Map<string, number>();
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const text = String(cell.value ?? "").trim().toLowerCase();
    if (text) headerMap.set(text, colNumber);
  });

  const nameCol = headerMap.get("item") ?? headerMap.get("name");
  const categoryCol = headerMap.get("category");
  const unitCol = headerMap.get("unit");

  if (!nameCol || !categoryCol || !unitCol) {
    return { error: "The file must have columns named Item (or Name), Category, and Unit." };
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let invalidUnit = 0;

  for (let r = 2; r <= worksheet.rowCount; r++) {
    const row = worksheet.getRow(r);
    const name = String(row.getCell(nameCol).value ?? "").trim();
    const category = String(row.getCell(categoryCol).value ?? "").trim();
    const unit = String(row.getCell(unitCol).value ?? "").trim().toLowerCase();

    if (!name || !category || !unit) {
      skipped++;
      continue;
    }
    if (!(UNITS as readonly string[]).includes(unit)) {
      invalidUnit++;
      continue;
    }

    const existing = await prisma.item.findUnique({ where: { name } });
    if (existing) {
      await prisma.item.update({ where: { id: existing.id }, data: { category, unit } });
      updated++;
    } else {
      await prisma.item.create({ data: { name, category, unit } });
      created++;
    }
  }

  revalidatePath("/items");
  revalidatePath("/log");
  revalidatePath("/dashboard");

  const notes: string[] = [];
  if (skipped > 0) notes.push(`skipped ${skipped} row(s) missing a value`);
  if (invalidUnit > 0)
    notes.push(`skipped ${invalidUnit} row(s) with a unit not in the standard list (${UNITS.join(", ")})`);
  const notesText = notes.length > 0 ? `, ${notes.join("; ")}` : "";

  return {
    success: `Import complete: ${created} item(s) added, ${updated} updated${notesText}. Nothing was removed - deactivate items you no longer stock from the list below.`,
  };
}
