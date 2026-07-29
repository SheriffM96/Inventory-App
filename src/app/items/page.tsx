import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";
import { UNITS } from "@/lib/units";
import AddItemForm from "./AddItemForm";
import ImportItemsForm from "./ImportItemsForm";
import AddVendorForm from "./AddVendorForm";
import AddRecipientForm from "./AddRecipientForm";
import AddMenuItemForm from "./AddMenuItemForm";
import ListSearch from "@/components/ListSearch";
import { toggleItemActiveAction, updateItemAction } from "./actions";
import { toggleVendorActiveAction } from "./vendor-actions";
import { toggleRecipientActiveAction } from "./recipient-actions";
import { toggleMenuItemActiveAction } from "./menu-actions";

const TEAM_LABELS: Record<string, string> = {
  KITCHEN: "Kitchen",
  BAR: "Bar",
  CLEANING: "Cleaning",
};

export default async function ItemsPage() {
  await requireRole(["MANAGER"]);

  const [items, vendors, recipients, menuItems] = await Promise.all([
    prisma.item.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.vendor.findMany({ orderBy: { name: "asc" } }),
    prisma.recipient.findMany({ orderBy: [{ team: "asc" }, { name: "asc" }] }),
    prisma.menuItem.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
  ]);
  const categories = Array.from(new Set(items.map((i) => i.category))).sort();
  const menuCategories = Array.from(new Set(menuItems.map((m) => m.category))).sort();

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
        <ListSearch scopeId="all-items" label="Search items by name or category" placeholder="Search by name or category..." />
        <div data-search-scope="all-items" className="overflow-x-auto">
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
                const toggleFormId = `item-toggle-form-${item.id}`;
                return (
                  <tr
                    key={item.id}
                    data-search-row
                    data-search={`${item.name} ${item.category}`.toLowerCase()}
                    className={!item.active ? "bg-stone-100 opacity-60" : undefined}
                  >
                    <td>
                      <form id={formId} action={updateItemAction}>
                        <input type="hidden" name="id" value={item.id} />
                      </form>
                      <input
                        form={formId}
                        name="name"
                        defaultValue={item.name}
                        disabled={!item.active}
                        className="input"
                      />
                    </td>
                    <td>
                      <input
                        form={formId}
                        name="category"
                        defaultValue={item.category}
                        disabled={!item.active}
                        className="input"
                      />
                    </td>
                    <td>
                      <select
                        form={formId}
                        name="unit"
                        defaultValue={item.unit}
                        disabled={!item.active}
                        className="input"
                      >
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
                        inputMode="decimal"
                        step="0.01"
                        defaultValue={item.reorderLevel ? Number(item.reorderLevel) : undefined}
                        disabled={!item.active}
                        className="input"
                      />
                    </td>
                    <td>
                      {!item.active && (
                        <span className="text-xs font-medium text-stone-500 mr-2">Inactive</span>
                      )}
                      <button
                        form={formId}
                        type="submit"
                        disabled={!item.active}
                        className="btn-secondary py-1 px-2 text-xs"
                      >
                        Save
                      </button>
                    </td>
                    <td>
                      <form id={toggleFormId} action={toggleItemActiveAction}>
                        <input type="hidden" name="id" value={item.id} />
                        <input type="hidden" name="active" value={String(item.active)} />
                      </form>
                      <button
                        form={toggleFormId}
                        type="submit"
                        aria-label={`${item.active ? "Deactivate" : "Activate"} ${item.name}`}
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
          <p data-search-empty className="hidden text-sm text-stone-500 pt-2">
            No items match your search.
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Vendors ({vendors.length})</h2>
        <p className="text-sm text-stone-600 mb-3">Suppliers you buy stock from - picked when logging a purchase.</p>
        <AddVendorForm />
        {vendors.length > 0 && (
          <ListSearch scopeId="vendors" label="Search vendors by name" placeholder="Search vendors..." />
        )}
        <div data-search-scope="vendors" className="mt-4 space-y-2">
          {vendors.map((vendor) => (
            <div
              key={vendor.id}
              data-search-row
              data-search={vendor.name.toLowerCase()}
              className={`flex items-center justify-between border-b border-stone-100 pb-2 ${
                !vendor.active ? "opacity-50" : ""
              }`}
            >
              <span>{vendor.name}</span>
              <form action={toggleVendorActiveAction}>
                <input type="hidden" name="id" value={vendor.id} />
                <input type="hidden" name="active" value={String(vendor.active)} />
                <button
                  type="submit"
                  aria-label={`${vendor.active ? "Deactivate" : "Activate"} ${vendor.name}`}
                  className="btn-secondary py-1 px-2 text-xs"
                >
                  {vendor.active ? "Deactivate" : "Activate"}
                </button>
              </form>
            </div>
          ))}
          {vendors.length === 0 && <p className="text-sm text-stone-500">No vendors added yet.</p>}
          <p data-search-empty className="hidden text-sm text-stone-500">
            No vendors match your search.
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Recipients ({recipients.length})</h2>
        <p className="text-sm text-stone-600 mb-3">
          Named people the storekeeper issues stock to - grouped by kitchen, bar, or cleaning team.
        </p>
        <AddRecipientForm />
        {recipients.length > 0 && (
          <ListSearch scopeId="recipients" label="Search recipients by name or team" placeholder="Search recipients..." />
        )}
        <div data-search-scope="recipients" className="mt-4 space-y-2">
          {recipients.map((recipient) => (
            <div
              key={recipient.id}
              data-search-row
              data-search={`${recipient.name} ${TEAM_LABELS[recipient.team]}`.toLowerCase()}
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
                <button
                  type="submit"
                  aria-label={`${recipient.active ? "Deactivate" : "Activate"} ${recipient.name}`}
                  className="btn-secondary py-1 px-2 text-xs"
                >
                  {recipient.active ? "Deactivate" : "Activate"}
                </button>
              </form>
            </div>
          ))}
          {recipients.length === 0 && <p className="text-sm text-stone-500">No recipients added yet.</p>}
          <p data-search-empty className="hidden text-sm text-stone-500">
            No recipients match your search.
          </p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Menu Items ({menuItems.length})</h2>
        <p className="text-sm text-stone-600 mb-3">
          Sellable dishes/drinks - the supervisor logs quantity sold per item in the end-of-day reconciliation.
        </p>
        <AddMenuItemForm categories={menuCategories} />
        {menuItems.length > 0 && (
          <ListSearch scopeId="menu-items" label="Search menu items by name or category" placeholder="Search menu items..." />
        )}
        <div data-search-scope="menu-items" className="mt-4 space-y-2">
          {menuItems.map((menuItem) => (
            <div
              key={menuItem.id}
              data-search-row
              data-search={`${menuItem.name} ${menuItem.category}`.toLowerCase()}
              className={`flex items-center justify-between border-b border-stone-100 pb-2 ${
                !menuItem.active ? "opacity-50" : ""
              }`}
            >
              <span>
                {menuItem.name} <span className="text-stone-400">({menuItem.category})</span>
              </span>
              <div className="flex items-center gap-2">
                <Link href={`/items/recipes/${menuItem.id}`} className="btn-secondary py-1 px-2 text-xs">
                  Recipe
                </Link>
                <form action={toggleMenuItemActiveAction}>
                  <input type="hidden" name="id" value={menuItem.id} />
                  <input type="hidden" name="active" value={String(menuItem.active)} />
                  <button
                    type="submit"
                    aria-label={`${menuItem.active ? "Deactivate" : "Activate"} ${menuItem.name}`}
                    className="btn-secondary py-1 px-2 text-xs"
                  >
                    {menuItem.active ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </div>
            </div>
          ))}
          {menuItems.length === 0 && <p className="text-sm text-stone-500">No menu items added yet.</p>}
          <p data-search-empty className="hidden text-sm text-stone-500">
            No menu items match your search.
          </p>
        </div>
      </div>
    </div>
  );
}
