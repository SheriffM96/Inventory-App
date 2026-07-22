"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";
import { Role } from "@/lib/session";

export type UserFormState = { error?: string; success?: string };

const VALID_ROLES: Role[] = ["STOREKEEPER", "KITCHEN", "BAR", "MANAGER"];

export async function createUserAction(_prev: UserFormState, formData: FormData): Promise<UserFormState> {
  await requireRole(["MANAGER"]);

  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "");
  const pin = String(formData.get("pin") || "");

  if (!name || !VALID_ROLES.includes(role as Role)) {
    return { error: "Name and a valid role are required." };
  }
  if (!/^\d{4,8}$/.test(pin)) {
    return { error: "PIN must be 4-8 digits." };
  }

  const pinHash = await bcrypt.hash(pin, 10);
  await prisma.user.create({ data: { name, role: role as Role, pinHash } });

  revalidatePath("/users");
  return { success: `Added staff member ${name}.` };
}

export async function updateUserRoleAction(formData: FormData): Promise<void> {
  await requireRole(["MANAGER"]);

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "");
  if (!id || !name || !VALID_ROLES.includes(role as Role)) return;

  await prisma.user.update({ where: { id }, data: { name, role: role as Role } });
  revalidatePath("/users");
}

export async function resetPinAction(formData: FormData): Promise<void> {
  await requireRole(["MANAGER"]);

  const id = String(formData.get("id") || "");
  const pin = String(formData.get("pin") || "");
  if (!id || !/^\d{4,8}$/.test(pin)) return;

  const pinHash = await bcrypt.hash(pin, 10);
  await prisma.user.update({ where: { id }, data: { pinHash } });
  revalidatePath("/users");
}

export async function toggleUserActiveAction(formData: FormData): Promise<void> {
  await requireRole(["MANAGER"]);

  const id = String(formData.get("id") || "");
  const active = String(formData.get("active") || "") === "true";
  if (!id) return;

  await prisma.user.update({ where: { id }, data: { active: !active } });
  revalidatePath("/users");
}
