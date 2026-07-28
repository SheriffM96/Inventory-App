import Link from "next/link";
import { ROLE_HOME, SessionPayload } from "@/lib/session";
import { logoutAction } from "@/app/login/actions";

export default function NavBar({ session }: { session: SessionPayload | null }) {
  if (!session) return null;

  const isManager = session.role === "MANAGER";
  const isLogRole = session.role === "STOREKEEPER" || session.role === "KITCHEN" || session.role === "BAR";

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
        <Link
          href={ROLE_HOME[session.role]}
          className="flex items-center gap-2 font-semibold text-brand-700 mr-2"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mishkak-logo.jpg" alt="" className="w-8 h-8 rounded" />
          Mishkak Inventory
        </Link>
        <nav className="flex flex-wrap gap-4 text-sm text-stone-600">
          {isLogRole && (
            <Link href="/log" className="hover:text-brand-700">
              Log Activity
            </Link>
          )}
          {session.role === "STOREKEEPER" && (
            <Link href="/stock-take" className="hover:text-brand-700">
              Stock Take
            </Link>
          )}
          {session.role === "SUPERVISOR" && (
            <Link href="/supervisor" className="hover:text-brand-700">
              Supervisor
            </Link>
          )}
          {isManager && (
            <>
              <Link href="/dashboard" className="hover:text-brand-700">
                Dashboard
              </Link>
              <Link href="/reports/daily" className="hover:text-brand-700">
                Daily Report
              </Link>
              <Link href="/reports/monthly" className="hover:text-brand-700">
                Monthly Report
              </Link>
              <Link href="/items" className="hover:text-brand-700">
                Items &amp; Vendors
              </Link>
              <Link href="/stock-take" className="hover:text-brand-700">
                Stock Take
              </Link>
              <Link href="/users" className="hover:text-brand-700">
                Staff
              </Link>
            </>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-stone-500">
            {session.name} <span className="text-stone-400">({session.role})</span>
          </span>
          <form action={logoutAction}>
            <button type="submit" className="btn-secondary py-1 px-3">
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
