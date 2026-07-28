"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";

async function reviewReconciliation(formData: FormData, status: "CONFIRMED" | "DISPUTED") {
  const session = await requireRole(["MANAGER"]);

  const id = String(formData.get("id") || "");
  const managerNotes = String(formData.get("managerNotes") || "").trim() || null;
  if (!id) return;

  const existing = await prisma.dailyReconciliation.findUnique({ where: { id } });
  if (!existing || existing.status !== "PENDING") return;

  await prisma.dailyReconciliation.update({
    where: { id },
    data: { status, managerNotes, reviewedById: session.userId, reviewedAt: new Date() },
  });

  revalidatePath("/dashboard");
  revalidatePath("/supervisor");
}

export async function confirmReconciliationAction(formData: FormData): Promise<void> {
  await reviewReconciliation(formData, "CONFIRMED");
}

export async function disputeReconciliationAction(formData: FormData): Promise<void> {
  await reviewReconciliation(formData, "DISPUTED");
}
