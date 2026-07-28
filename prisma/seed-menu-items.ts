import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedMenuItem = { name: string; category: string };

// Kept in sync with the MENU_ITEMS list in seed.ts. Duplicated here (rather
// than imported) so this script stays fully standalone and safe to run
// against production - unlike seed.ts, it touches nothing but MenuItem rows,
// so it never risks resetting real staff PINs or item/vendor data.
const MENU_ITEMS: SeedMenuItem[] = [
  // Mezze
  { name: "Arabic Brunch Platter", category: "Mezze" },
  { name: "Soujouk", category: "Mezze" },
  { name: "Kibdah", category: "Mezze" },
  { name: "Manaish", category: "Mezze" },
  { name: "Lahm Bajine", category: "Mezze" },
  { name: "Hummus", category: "Mezze" },
  { name: "Falafel", category: "Mezze" },
  { name: "Batata Harra", category: "Mezze" },
  { name: "Kibbeh", category: "Mezze" },
  { name: "Arayes (Maria)", category: "Mezze" },
  { name: "Sambuusa", category: "Mezze" },

  // Signature Rice
  { name: "Mandi", category: "Signature Rice" },
  { name: "Kabsa", category: "Signature Rice" },
  { name: "Ouzi Rice (Friday Special)", category: "Signature Rice" },
  { name: "Signature Rice Plate", category: "Signature Rice" },

  // Grills
  { name: "Mishkak Signature Platter", category: "Grills" },
  { name: "Whole Chicken Grill", category: "Grills" },
  { name: "Fish Grill", category: "Grills" },

  // Salads & Sides
  { name: "Arabic Salad", category: "Salads & Sides" },
  { name: "Tabbouleh", category: "Salads & Sides" },
  { name: "Fattoush", category: "Salads & Sides" },
  { name: "Chicken Wings", category: "Salads & Sides" },
  { name: "Fries", category: "Salads & Sides" },

  // Desserts
  { name: "Mishkak Signature Dessert", category: "Desserts" },
  { name: "Qatayef", category: "Desserts" },
  { name: "Oum Ali", category: "Desserts" },
  { name: "Muhallabia", category: "Desserts" },

  // Teas & Coffee
  { name: "Mint Tea", category: "Teas & Coffee" },
  { name: "Karak Tea", category: "Teas & Coffee" },
  { name: "Arabian Tea", category: "Teas & Coffee" },
  { name: "Qahwa (Arabic Coffee)", category: "Teas & Coffee" },

  // Milkshakes
  { name: "Almond & Dates Milkshake", category: "Milkshakes" },
  { name: "Pistachio Milkshake", category: "Milkshakes" },
  { name: "Rose & Vanilla Milkshake", category: "Milkshakes" },
  { name: "Avocado Milkshake", category: "Milkshakes" },

  // Beverages
  { name: "Still Water", category: "Beverages" },
  { name: "Soft Drinks", category: "Beverages" },
  { name: "Fresh Juices", category: "Beverages" },

  // Mocktails
  { name: "Desert Bloom", category: "Mocktails" },
  { name: "Nakheel Frost", category: "Mocktails" },
  { name: "Bahr Al Asfar", category: "Mocktails" },
  { name: "Shams Al Ahmar", category: "Mocktails" },
  { name: "Tamr Al Layl", category: "Mocktails" },
  { name: "Zahr Al Layl", category: "Mocktails" },
  { name: "Rumman Fizz", category: "Mocktails" },
  { name: "Haras Al Aish", category: "Mocktails" },
];

async function main() {
  console.log(`Upserting ${MENU_ITEMS.length} menu items...`);
  for (const item of MENU_ITEMS) {
    await prisma.menuItem.upsert({
      where: { name: item.name },
      update: { category: item.category },
      create: { name: item.name, category: item.category },
    });
  }
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
