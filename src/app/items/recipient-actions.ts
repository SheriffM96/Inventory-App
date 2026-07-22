"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";

export type RecipientFormState = { error?: string; success?: string };

const VALID_TEAMS = ["KITCHEN", "BAR", "CLEANING"];

export async function createRecipientAction(
  _prev: RecipientFormState,
  formData: FormData
): Promise<RecipientFormState> {
  await requireRole(["MANAGER"]);

  const name = String(formData.get("name") || "").trim();
  const team = String(formData.get("team") || "");

  if (!name) return { error: "Name is required." };
  if (!VALID_TEAMS.includes(team)) return { error: "Choose a valid team." };

  await prisma.recipient.create({ data: { name, team: team as "KITCHEN" | "BAR" | "CLEANING" } });
  revalidatePath("/items");
  revalidatePath("/log");
  return { success: `Added ${name} (${team.toLowerCase()}).` };
}

export async function toggleRecipientActiveAction(formData: FormData): Promise<void> {
  await requireRole(["MANAGER"]);

  const id = String(formData.get("id") || "");
  const active = String(formData.get("active") || "") === "true";
  if (!id) return;

  await prisma.recipient.update({ where: { id }, data: { active: !active } });
  revalidatePath("/items");
  revalidatePath("/log");
}
