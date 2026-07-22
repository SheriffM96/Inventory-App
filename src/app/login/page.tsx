import { prisma } from "@/lib/db";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const users = await prisma.user.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });

  return (
    <div className="max-w-sm mx-auto mt-12">
      <div className="card">
        <h1 className="text-xl font-semibold mb-1 text-brand-700">Mishkak Inventory</h1>
        <p className="text-sm text-stone-500 mb-6">Sign in to log or view inventory activity.</p>
        <LoginForm users={users} next={searchParams.next ?? "/log"} />
      </div>
    </div>
  );
}
