import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";
import { UNITS } from "@/lib/units";
import AddItemForm from "./AddItemForm";
import ImportItemsForm from "./ImportItemsForm";
import AddVendorForm from "./AddVendorForm";
import AddRecipientForm from "./AddRecipientForm";
import { toggleItemActiveAction, updateItemAction } from "./actions";
import { toggleVendorActiveAction } from "./vendor-actions";
import { toggleRecipientActiveAction } from "./recipient-actions";

const TEAM_LABELS: Record<string, string> = {
  KITCHEN: "Kitchen",
  BAR: "Bar",
  CLEANING: "Cleaning",
};

export default async function ItemsPage() {
  await requireRole(["MANAGER"]);

  const [items, vendors, recipients] = await Promise.all([
    prisma.item.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    prisma.recipient.findMany({ orderBy: [{ team: "asc" }, { name: "asc" }] }),
  ]);
  const categories = Array.from(new Set(items.map((i) => i.category))).sort();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Items &amp; Vendors</h1>

      <div className="card">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
          <h2 className="text-lg font-semibold">Bulk Update Items from Excel</h2>
          <a href="/api/items/template" className="btn-secondary">
            Download Template
          </a>
        </div>
        <ImportItemsForm />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Add a New Item</h2>
        <AddItemForm categories={categories} />
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">All Items ({items.length})</h2>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Reorder Level</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const formId = `item-form-${item.id}`;
                return (
                  <tr key={item.id} className={!item.active ? "opacity-50" : undefined}>
                    <td>
                      <form id={formId} action={updateItemAction}>
                        <input type="hidden" name="id" value={item.id} />
                      </form>
                      <input form={formId} name="name" defaultValue={item.name} className="input" />
                    </td>
                    <td>
                      <input form={formId} name="category" defaultValue={item.category} className="input" />
                    </td>
                    <td>
                      <select form={formId} name="unit" defaultValue={item.unit} className="input">
                        {UNITS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        form={formId}
                        name="reorderLevel"
                        type="number"
                        step="0.01"
                        defaultValue={item.reorderLevel ? Number(item.reorderLevel) : undefined}
                        className="input"
                      />
                    </td>
                    <td>
                      <button form={formId} type="submit" className="btn-secondary py-1 px-2 text-xs">
                        Save
                      </button>
                    </td>
                    <td>
                      <button
                        form={formId}
                        type="submit"
                        formAction={toggleItemActiveAction}
                        name="active"
                        value={String(item.active)}
                        className="btn-secondary py-1 px-2 text-xs"
                      >
                        {item.active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Vendors ({vendors.length})</h2>
        <p className="text-sm text-stone-600 mb-3">Suppliers you buy stock from - picked when logging a purchase.</p>
        <AddVendorForm />
        <div className="mt-4 space-y-2">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              className={`flex items-center justify-between border-b border-stone-100 pb-2 ${
                !vendor.active ? "opacity-50" : ""
              }`}
            >
              <span>{vendor.name}</span>
              <form action={toggleVendorActiveAction}>
                <input type="hidden" name="id" value={vendor.id} />
                <input type="hidden" name="active" value={String(vendor.active)} />
                <button type="submit" className="btn-secondary py-1 px-2 text-xs">
                  {vendor.active ? "Deactivate" : "Activate"}
                </button>
              </form>
            </div>
          ))}
          {vendors.length === 0 && <p className="text-sm text-stone-500">No vendors added yet.</p>}
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Recipients ({recipients.length})</h2>
        <p className="text-sm text-stone-600 mb-3">
          Named people the storekeeper issues stock to - grouped by kitchen, bar, or cleaning team.
        </p>
        <AddRecipientForm />
        <div className="mt-4 space-y-2">
          {recipients.map((recipient) => (
            <div
              key={recipient.id}
              className={`flex items-center justify-between border-b border-stone-100 pb-2 ${
                !recipient.active ? "opacity-50" : ""
              }`}
            >
              <span>
                {recipient.name} <span className="text-stone-400">({TEAM_LABELS[recipient.team]})</span>
              </span>
              <form action={toggleRecipientActiveAction}>
                <input type="hidden" name="id" value={recipient.id} />
                <input type="hidden" name="active" value={String(recipient.active)} />
                <button type="submit" className="btn-secondary py-1 px-2 text-xs">
                  {recipient.active ? "Deactivate" : "Activate"}
                </button>
              </form>
            </div>
          ))}
          {recipients.length === 0 && <p className="text-sm text-stone-500">No recipients added yet.</p>}
        </div>
      </div>
    </div>
  );
}
