import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";
import AddUserForm from "./AddUserForm";
import ListSearch from "@/components/ListSearch";
import { resetPinAction, toggleUserActiveAction, updateUserRoleAction } from "./actions";

const ROLE_LABELS: Record<string, string> = {
  STOREKEEPER: "Storekeeper",
  KITCHEN: "Kitchen Staff",
  BAR: "Bar Staff",
  MANAGER: "Manager",
  SUPERVISOR: "Supervisor",
};

export default async function UsersPage() {
  await requireRole(["MANAGER"]);

  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Manage Staff</h1>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Add Staff Member</h2>
        <AddUserForm />
      </div>

      {users.length > 0 && (
        <ListSearch scopeId="staff" label="Search staff by name or role" placeholder="Search staff by name or role..." />
      )}
      <div className="space-y-3" data-search-scope="staff">
        {users.map((user) => (
          <div
            key={user.id}
            data-search-row
            data-search={`${user.name} ${ROLE_LABELS[user.role] ?? user.role}`.toLowerCase()}
            className={`card ${!user.active ? "opacity-50" : ""}`}
          >
            <div className="flex flex-wrap gap-4 items-end">
              <form action={updateUserRoleAction} className="flex flex-wrap gap-2 items-end">
                <input type="hidden" name="id" value={user.id} />
                <div>
                  <label className="label" htmlFor={`staff-name-${user.id}`}>
                    Name
                  </label>
                  <input id={`staff-name-${user.id}`} name="name" defaultValue={user.name} className="input" />
                </div>
                <div>
                  <label className="label" htmlFor={`staff-role-${user.id}`}>
                    Role
                  </label>
                  <select id={`staff-role-${user.id}`} name="role" defaultValue={user.role} className="input">
                    {Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" aria-label={`Save changes to ${user.name}`} className="btn-secondary">
                  Save
                </button>
              </form>

              <form action={resetPinAction} className="flex gap-2 items-end">
                <input type="hidden" name="id" value={user.id} />
                <div>
                  <label className="label" htmlFor={`staff-pin-${user.id}`}>
                    New PIN
                  </label>
                  <input
                    id={`staff-pin-${user.id}`}
                    name="pin"
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    className="input w-28"
                  />
                </div>
                <button type="submit" aria-label={`Reset PIN for ${user.name}`} className="btn-secondary">
                  Reset PIN
                </button>
              </form>

              <form action={toggleUserActiveAction}>
                <input type="hidden" name="id" value={user.id} />
                <input type="hidden" name="active" value={String(user.active)} />
                <button
                  type="submit"
                  aria-label={`${user.active ? "Deactivate" : "Activate"} ${user.name}`}
                  className="btn-secondary"
                >
                  {user.active ? "Deactivate" : "Activate"}
                </button>
              </form>
            </div>
          </div>
        ))}
        <p data-search-empty className="hidden text-sm text-stone-500">
          No staff match your search.
        </p>
      </div>
    </div>
  );
}
