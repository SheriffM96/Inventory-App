import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedItem = { name: string; category: string; unit: string };

// Deduplicated from Mishkak_All_Items_Blank_Unit_Price.xlsx (~230 recipe-costing
// rows collapsed into one row per real-world stock item), grouped into the
// categories a typical restaurant tracks stock by. Kitchen equipment and
// tableware are deliberately left out - they aren't day-to-day stock.
const ITEMS: SeedItem[] = [
  // Meat, Poultry & Seafood
  { name: "Whole lamb (bone-in)", category: "Meat, Poultry & Seafood", unit: "kg" },
  { name: "Goat meat (bone-in)", category: "Meat, Poultry & Seafood", unit: "kg" },
  { name: "Minced lamb/beef", category: "Meat, Poultry & Seafood", unit: "kg" },
  { name: "Whole chicken", category: "Meat, Poultry & Seafood", unit: "kg" },
  { name: "Chicken wings", category: "Meat, Poultry & Seafood", unit: "kg" },
  { name: "Chicken thighs/breast (Shawarma)", category: "Meat, Poultry & Seafood", unit: "kg" },
  { name: "Beef (Shawarma)", category: "Meat, Poultry & Seafood", unit: "kg" },
  { name: "Lebanese sausage (Soujouk)", category: "Meat, Poultry & Seafood", unit: "kg" },
  { name: "Lamb/chicken bones (stock)", category: "Meat, Poultry & Seafood", unit: "kg" },
  { name: "Whole fish (sea bass/tilapia)", category: "Meat, Poultry & Seafood", unit: "kg" },

  // Dairy & Fats
  { name: "Ghee", category: "Dairy & Fats", unit: "kg" },
  { name: "Butter", category: "Dairy & Fats", unit: "kg" },
  { name: "Vegetable oil", category: "Dairy & Fats", unit: "litre" },
  { name: "Olive oil", category: "Dairy & Fats", unit: "litre" },
  { name: "Full-fat milk", category: "Dairy & Fats", unit: "litre" },
  { name: "Heavy/double cream", category: "Dairy & Fats", unit: "litre" },
  { name: "Clotted cream/ashta", category: "Dairy & Fats", unit: "kg" },
  { name: "Greek yoghurt", category: "Dairy & Fats", unit: "kg" },
  { name: "Labneh", category: "Dairy & Fats", unit: "kg" },
  { name: "Akkawi/Nabulsi cheese", category: "Dairy & Fats", unit: "kg" },
  { name: "Condensed milk", category: "Dairy & Fats", unit: "tin" },
  { name: "Evaporated milk", category: "Dairy & Fats", unit: "tin" },
  { name: "Almond milk (carton)", category: "Dairy & Fats", unit: "carton" },
  { name: "Ice cream (vanilla base)", category: "Dairy & Fats", unit: "litre" },

  // Fruits & Vegetables
  { name: "Onions (yellow)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Garlic (fresh)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Ginger (fresh)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Tomatoes (fresh)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Fresh coriander", category: "Fruits & Vegetables", unit: "bunch" },
  { name: "Fresh parsley", category: "Fruits & Vegetables", unit: "bunch" },
  { name: "Fresh mint", category: "Fruits & Vegetables", unit: "bunch" },
  { name: "Bell peppers (red)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Bell peppers (green)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Chilli peppers (fresh red)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Courgette/zucchini", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Aubergine/eggplant", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Carrots", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Potatoes", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Cucumber", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Lettuce", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Spring onions", category: "Fruits & Vegetables", unit: "bunch" },
  { name: "Lemons", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Limes", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Pineapple (fresh or tinned)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Oranges (fresh, for juicing)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Mango pulp", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Mixed fruit puree", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Dates (pitted, garnish)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Dates - Medjool", category: "Fruits & Vegetables", unit: "kg" },

  // Dry & Pantry Ingredients
  { name: "Basmati rice", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Chickpeas (dried)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Plain flour", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Semolina (fine)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Dried yeast", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Baking powder", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Cornstarch", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Sesame seeds (white)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Cumin (ground)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Coriander (ground)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Turmeric", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Black pepper", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "White pepper", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Cinnamon (ground)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Cinnamon sticks", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Cardamom (ground)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Cardamom pods (whole)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Cloves (whole)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Allspice/baharat", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Loomi/dried black lime", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Saffron", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Bay leaves", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Nutmeg (ground)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Paprika (sweet)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Smoked paprika", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Chilli flakes", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Ginger (ground)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Sumac", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Za'atar (dried blend)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Nigella seeds", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Vanilla extract", category: "Dry & Pantry Ingredients", unit: "ml" },
  { name: "Salt", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Arabic flatbread", category: "Dry & Pantry Ingredients", unit: "pcs" },
  { name: "Sambuusa pastry wrappers", category: "Dry & Pantry Ingredients", unit: "pack" },
  { name: "Kadaif/knafeh pastry shreds", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Filo pastry sheets", category: "Dry & Pantry Ingredients", unit: "pack" },
  { name: "Pine nuts", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Almonds (blanched)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Raisins", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Pistachios (shelled)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Walnuts (shelled)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Mixed nuts (assorted)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Desiccated coconut", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Pistachio paste", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Tomato paste", category: "Dry & Pantry Ingredients", unit: "tin" },
  { name: "Tomato sauce (tinned)", category: "Dry & Pantry Ingredients", unit: "tin" },
  { name: "Tahini", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Hot sauce/Tabasco", category: "Dry & Pantry Ingredients", unit: "bottle" },
  { name: "Garlic paste", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Muhammara paste", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Pomegranate molasses", category: "Dry & Pantry Ingredients", unit: "bottle" },
  { name: "Pickled cucumbers", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Pickled turnip (pink)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Pickled green chillies", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "White vinegar", category: "Dry & Pantry Ingredients", unit: "litre" },
  { name: "Honey", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Mastic/gum arabic", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Sugar (white)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Chicken stock/bouillon", category: "Dry & Pantry Ingredients", unit: "pack" },
  { name: "Lamb stock/bouillon", category: "Dry & Pantry Ingredients", unit: "pack" },

  // Beverages & Mocktail Supplies
  { name: "Loose-leaf mint tea", category: "Beverages & Mocktail Supplies", unit: "kg" },
  { name: "Arabian black tea (loose leaf)", category: "Beverages & Mocktail Supplies", unit: "kg" },
  { name: "Karak tea spice blend", category: "Beverages & Mocktail Supplies", unit: "g" },
  { name: "Soft drinks (assorted cases)", category: "Beverages & Mocktail Supplies", unit: "case" },
  { name: "Still water (600ml bottles)", category: "Beverages & Mocktail Supplies", unit: "case" },
  { name: "Rose water", category: "Beverages & Mocktail Supplies", unit: "ml" },
  { name: "Orange blossom water", category: "Beverages & Mocktail Supplies", unit: "ml" },
  { name: "Rose syrup", category: "Beverages & Mocktail Supplies", unit: "bottle" },
  { name: "Sugar syrup", category: "Beverages & Mocktail Supplies", unit: "litre" },

  // Disposables & Packaging
  { name: "Aluminium foil trays", category: "Disposables & Packaging", unit: "pcs" },
  { name: "Aluminium foil (rolls)", category: "Disposables & Packaging", unit: "roll" },
  { name: "Cling film (rolls)", category: "Disposables & Packaging", unit: "roll" },
  { name: "Greaseproof/baking paper (rolls)", category: "Disposables & Packaging", unit: "roll" },
  { name: "Disposable gloves", category: "Disposables & Packaging", unit: "box" },
  { name: "Skewers (wooden, disposable)", category: "Disposables & Packaging", unit: "pack" },
  { name: "Charcoal", category: "Disposables & Packaging", unit: "kg" },

  // Cleaning & Hygiene
  { name: "Hand soap (kitchen)", category: "Cleaning & Hygiene", unit: "bottle" },
  { name: "Dish soap (commercial)", category: "Cleaning & Hygiene", unit: "bottle" },
  { name: "Sanitiser spray", category: "Cleaning & Hygiene", unit: "bottle" },
  { name: "Bin liners (heavy duty)", category: "Cleaning & Hygiene", unit: "pack" },
];

async function main() {
  console.log(`Seeding ${ITEMS.length} items...`);
  for (const item of ITEMS) {
    await prisma.item.upsert({
      where: { name: item.name },
      update: { category: item.category, unit: item.unit },
      create: { name: item.name, category: item.category, unit: item.unit },
    });
  }

  const demoUsers: { name: string; pin: string; role: Role }[] = [
    { name: "Storekeeper", pin: "1111", role: "STOREKEEPER" },
    { name: "Kitchen Staff", pin: "2222", role: "KITCHEN" },
    { name: "Bar Staff", pin: "3333", role: "BAR" },
    { name: "Manager", pin: "9999", role: "MANAGER" },
  ];

  console.log("Seeding demo users (change PINs after first login)...");
  for (const u of demoUsers) {
    const pinHash = await bcrypt.hash(u.pin, 10);
    const existing = await prisma.user.findFirst({ where: { name: u.name } });
    if (existing) {
      await prisma.user.update({ where: { id: existing.id }, data: { pinHash, role: u.role } });
    } else {
      await prisma.user.create({ data: { name: u.name, pinHash, role: u.role } });
    }
  }

  console.log(
    "Done. Demo PINs -> Storekeeper: 1111, Kitchen Staff: 2222, Bar Staff: 3333, Manager: 9999"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
