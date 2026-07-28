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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mishkak-logo.jpg" alt="Mishkak" className="w-24 h-24 mx-auto mb-3 rounded" />
        <h1 className="text-xl font-semibold mb-1 text-brand-700 text-center">Mishkak Inventory</h1>
        <p className="text-sm text-stone-500 mb-6 text-center">Sign in to log or view inventory activity.</p>
        <LoginForm users={users} next={searchParams.next ?? ""} />
      </div>
    </div>
  );
}
