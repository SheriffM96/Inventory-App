import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/require-session";
import ConfirmDeleteForm from "@/components/ConfirmDeleteForm";
import AddRecipeItemForm from "../../AddRecipeItemForm";
import { removeRecipeItemAction } from "../../recipe-actions";

export default async function RecipePage({ params }: { params: { menuItemId: string } }) {
  await requireRole(["MANAGER"]);

  const [menuItem, items] = await Promise.all([
    prisma.menuItem.findUnique({
      where: { id: params.menuItemId },
      include: { recipeItems: { include: { item: true }, orderBy: { item: { name: "asc" } } } },
    }),
    prisma.item.findMany({
      where: { active: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: { id: true, name: true, unit: true, category: true },
    }),
  ]);

  if (!menuItem) notFound();

  const usedItemIds = new Set(menuItem.recipeItems.map((r) => r.itemId));
  const availableItems = items.filter((i) => !usedItemIds.has(i.id));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/items" className="text-sm text-brand-700 hover:underline">
          &larr; Back to Items &amp; Vendors
        </Link>
        <h1 className="text-xl font-semibold mt-1">
          Recipe: {menuItem.name} <span className="text-stone-400 font-normal">({menuItem.category})</span>
        </h1>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Ingredients (per unit sold)</h2>
        {menuItem.recipeItems.length === 0 ? (
          <p className="text-sm text-stone-500 mb-4">
            No ingredients mapped yet - the sales-vs-usage comparison won&apos;t work for this dish until you add
            some below.
          </p>
        ) : (
          <table className="table-base mb-4">
            <thead>
              <tr>
                <th>Ingredient</th>
                <th>Category</th>
                <th>Quantity per unit sold</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {menuItem.recipeItems.map((r) => (
                <tr key={r.id}>
                  <td>{r.item.name}</td>
                  <td className="text-stone-500">{r.item.category}</td>
                  <td>
                    {r.quantityPerUnit.toString()} {r.item.unit}
                  </td>
                  <td>
                    <ConfirmDeleteForm
                      action={removeRecipeItemAction}
                      id={r.id}
                      confirmMessage={`Remove ${r.item.name} from this recipe?`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {availableItems.length === 0 ? (
          <p className="text-sm text-stone-500">All active ingredient items are already in this recipe.</p>
        ) : (
          <AddRecipeItemForm menuItemId={menuItem.id} items={availableItems} />
        )}
      </div>
    </div>
  );
}
