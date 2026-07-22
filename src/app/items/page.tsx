import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";
import AddItemForm from "./AddItemForm";
import { toggleItemActiveAction, updateItemAction } from "./actions";

export default async function ItemsPage() {
  await requireRole(["MANAGER"]);

  const items = await prisma.item.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] });
  const categories = Array.from(new Set(items.map((i) => i.category))).sort();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Manage Items</h1>

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
                      <input form={formId} name="unit" defaultValue={item.unit} className="input" />
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
    </div>
  );
}
