"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";

export type LoginState = { error?: string };

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const userId = String(formData.get("userId") || "");
  const pin = String(formData.get("pin") || "");
  const next = String(formData.get("next") || "/log");

  if (!userId || !pin) {
    return { error: "Select your name and enter your PIN." };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.active) {
    return { error: "That account is not available. Ask your manager." };
  }

  const valid = await bcrypt.compare(pin, user.pinHash);
  if (!valid) {
    return { error: "Wrong PIN. Try again." };
  }

  await setSessionCookie({ userId: user.id, name: user.name, role: user.role });
  redirect(next && next.startsWith("/") ? next : "/log");
}

export async function logoutAction() {
  "use server";
  await clearSessionCookie();
  redirect("/login");
}
