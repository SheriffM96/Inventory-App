import { redirect } from "next/navigation";
import { getSession, ROLE_HOME } from "@/lib/session";

export default async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  redirect(ROLE_HOME[session.role]);
}
