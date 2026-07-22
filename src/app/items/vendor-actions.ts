"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";

export type VendorFormState = { error?: string; success?: string };

export async function createVendorAction(_prev: VendorFormState, formData: FormData): Promise<VendorFormState> {
  await requireRole(["MANAGER"]);

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Vendor name is required." };

  const existing = await prisma.vendor.findUnique({ where: { name } });
  if (existing) return { error: "A vendor with that name already exists." };

  await prisma.vendor.create({ data: { name } });
  revalidatePath("/items");
  revalidatePath("/log");
  return { success: `Added vendor ${name}.` };
}

export async function toggleVendorActiveAction(formData: FormData): Promise<void> {
  await requireRole(["MANAGER"]);

  const id = String(formData.get("id") || "");
  const active = String(formData.get("active") || "") === "true";
  if (!id) return;

  await prisma.vendor.update({ where: { id }, data: { active: !active } });
  revalidatePath("/items");
  revalidatePath("/log");
}
