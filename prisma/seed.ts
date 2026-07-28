import { PrismaClient, Role, Team } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedItem = { name: string; category: string; unit: string };

// Derived from the actual Mishkak menu (mezze, signature rice, grills, salads
// & sides, desserts, teas, milkshakes, beverages, mocktails) and the 9-recipe
// mocktail book, grouped into the categories a typical restaurant tracks
// stock by. Kitchen equipment and tableware are deliberately left out - they
// aren't day-to-day stock.
const ITEMS: SeedItem[] = [
  // Meat, Poultry & Seafood
  { name: "Whole lamb (bone-in)", category: "Meat, Poultry & Seafood", unit: "kg" },
  { name: "Goat meat (bone-in)", category: "Meat, Poultry & Seafood", unit: "kg" },
  { name: "Minced lamb/beef", category: "Meat, Poultry & Seafood", unit: "kg" },
  { name: "Whole chicken", category: "Meat, Poultry & Seafood", unit: "kg" },
  { name: "Chicken wings", category: "Meat, Poultry & Seafood", unit: "kg" },
  { name: "Chicken thighs/breast (Shawarma/Tawook)", category: "Meat, Poultry & Seafood", unit: "kg" },
  { name: "Beef (Shawarma)", category: "Meat, Poultry & Seafood", unit: "kg" },
  { name: "Lebanese sausage (Soujouk)", category: "Meat, Poultry & Seafood", unit: "kg" },
  { name: "Lamb/chicken bones (stock)", category: "Meat, Poultry & Seafood", unit: "kg" },
  { name: "Whole fish (Fish Grill)", category: "Meat, Poultry & Seafood", unit: "kg" },

  // Dairy & Fats
  { name: "Ghee", category: "Dairy & Fats", unit: "kg" },
  { name: "Butter", category: "Dairy & Fats", unit: "kg" },
  { name: "Vegetable oil", category: "Dairy & Fats", unit: "litre" },
  { name: "Olive oil", category: "Dairy & Fats", unit: "litre" },
  { name: "Full-fat milk", category: "Dairy & Fats", unit: "litre" },
  { name: "Heavy/double cream", category: "Dairy & Fats", unit: "litre" },
  { name: "Clotted cream/ashta (Oum Ali, Qatayef)", category: "Dairy & Fats", unit: "kg" },
  { name: "Greek yoghurt", category: "Dairy & Fats", unit: "kg" },
  { name: "Labneh", category: "Dairy & Fats", unit: "kg" },
  { name: "Akkawi/Nabulsi cheese (Manaish)", category: "Dairy & Fats", unit: "kg" },
  { name: "Condensed milk", category: "Dairy & Fats", unit: "tin" },
  { name: "Evaporated milk", category: "Dairy & Fats", unit: "tin" },
  { name: "Almond milk (carton)", category: "Dairy & Fats", unit: "carton" },
  { name: "Ice cream (vanilla base, Mishkak Signature Dessert)", category: "Dairy & Fats", unit: "litre" },

  // Fruits & Vegetables
  { name: "Onions (yellow)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Garlic (fresh)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Ginger (fresh)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Tomatoes (fresh)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Fresh coriander", category: "Fruits & Vegetables", unit: "bunch" },
  { name: "Fresh parsley (Tabbouleh)", category: "Fruits & Vegetables", unit: "bunch" },
  { name: "Fresh mint", category: "Fruits & Vegetables", unit: "bunch" },
  { name: "Fresh basil (Bahr Al Asfar mocktail)", category: "Fruits & Vegetables", unit: "bunch" },
  { name: "Bell peppers (red)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Bell peppers (green)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Chilli peppers (fresh red)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Courgette/zucchini", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Aubergine/eggplant", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Carrots", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Potatoes (Batata Harra, fries)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Cucumber (Fattoush, Arabian Salad)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Lettuce/greens (Fattoush)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Spring onions", category: "Fruits & Vegetables", unit: "bunch" },
  { name: "Lemons", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Limes", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Green apples (Granny Smith)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Avocado (milkshake)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Watermelon (Desert Bloom mocktail)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Fresh strawberries (garnish)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Pineapple (fresh juice)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Oranges (fresh juice)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Mango (fresh juice)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Mixed fruit (fresh juice blend)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Fresh pomegranate (juicing)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Dates (pitted, garnish)", category: "Fruits & Vegetables", unit: "kg" },
  { name: "Dates - Medjool (milkshake)", category: "Fruits & Vegetables", unit: "kg" },

  // Dry & Pantry Ingredients
  { name: "Basmati rice (Mandi, Kabsa, Ouzi)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Bulgur (fine, Kibbeh/Tabbouleh)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Chickpeas (dried, Hummus/Falafel)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Plain flour", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Semolina (fine, Basbousa/Qatayef)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Dried yeast", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Baking powder", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Cornstarch (Muhallabia)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Sesame seeds (white)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Cumin (ground)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Coriander (ground)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Turmeric", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Black pepper", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "White pepper", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Cinnamon (ground)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Cinnamon sticks", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Cardamom (ground, Tamr Al Layl mocktail)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Cardamom pods (whole)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Cloves (whole)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Allspice/baharat", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Loomi/dried black lime", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Saffron (Mandi/Kabsa)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Bay leaves", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Nutmeg (ground)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Paprika (sweet)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Smoked paprika", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Chilli flakes", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Ginger (ground)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Sumac (Fattoush)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Za'atar (dried blend, Manaish)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Nigella seeds", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Vanilla extract", category: "Dry & Pantry Ingredients", unit: "ml" },
  { name: "Salt", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Black salt/kala namak (Shams Al Ahmar mocktail)", category: "Dry & Pantry Ingredients", unit: "g" },
  { name: "Arabic flatbread (Manaish, Lahm Bajine, Shawarma)", category: "Dry & Pantry Ingredients", unit: "pcs" },
  { name: "Sambuusa pastry wrappers", category: "Dry & Pantry Ingredients", unit: "pack" },
  { name: "Kadaif/knafeh pastry shreds", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Filo pastry sheets (Oum Ali)", category: "Dry & Pantry Ingredients", unit: "pack" },
  { name: "Pine nuts (Kibbeh)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Almonds (blanched)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Raisins", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Pistachios (shelled, milkshake/desserts)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Pistachio paste (milkshake)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Walnuts (shelled)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Mixed nuts (assorted)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Desiccated coconut (Oum Ali)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Tomato paste (Kabsa)", category: "Dry & Pantry Ingredients", unit: "tin" },
  { name: "Tomato sauce (tinned)", category: "Dry & Pantry Ingredients", unit: "tin" },
  { name: "Tahini (Hummus, dipping)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Toum/garlic sauce (Shawarma Platter)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Hot sauce/Tabasco", category: "Dry & Pantry Ingredients", unit: "bottle" },
  { name: "Garlic paste", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Muhammara paste (Manaish)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Pomegranate molasses (Fattoush dressing)", category: "Dry & Pantry Ingredients", unit: "bottle" },
  { name: "Pickled cucumbers (Shawarma Platter)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Pickled turnip (pink)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Pickled green chillies", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "White vinegar", category: "Dry & Pantry Ingredients", unit: "litre" },
  { name: "Honey (Basbousa, honey syrup)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Sugar (white)", category: "Dry & Pantry Ingredients", unit: "kg" },
  { name: "Chicken stock/bouillon", category: "Dry & Pantry Ingredients", unit: "pack" },
  { name: "Lamb stock/bouillon", category: "Dry & Pantry Ingredients", unit: "pack" },
  { name: "Arabic/Turkish coffee (ground, Qahwa)", category: "Dry & Pantry Ingredients", unit: "kg" },

  // Beverages & Mocktail Supplies
  { name: "Loose-leaf mint tea", category: "Beverages & Mocktail Supplies", unit: "kg" },
  { name: "Arabian black tea (loose leaf)", category: "Beverages & Mocktail Supplies", unit: "kg" },
  { name: "Karak tea spice blend", category: "Beverages & Mocktail Supplies", unit: "g" },
  { name: "Soft drinks (assorted cases)", category: "Beverages & Mocktail Supplies", unit: "case" },
  { name: "Still water (600ml bottles)", category: "Beverages & Mocktail Supplies", unit: "case" },
  { name: "Sparkling water", category: "Beverages & Mocktail Supplies", unit: "case" },
  { name: "Rose water", category: "Beverages & Mocktail Supplies", unit: "ml" },
  { name: "Orange blossom water", category: "Beverages & Mocktail Supplies", unit: "ml" },
  { name: "Rose syrup", category: "Beverages & Mocktail Supplies", unit: "bottle" },
  { name: "Sugar syrup (simple syrup 1:1)", category: "Beverages & Mocktail Supplies", unit: "litre" },
  { name: "Mint syrup (house-made)", category: "Beverages & Mocktail Supplies", unit: "litre" },
  { name: "Honey syrup (house-made)", category: "Beverages & Mocktail Supplies", unit: "litre" },
  { name: "Coconut water", category: "Beverages & Mocktail Supplies", unit: "litre" },
  { name: "Fresh apple juice (pressed)", category: "Beverages & Mocktail Supplies", unit: "litre" },
  { name: "Peach jam", category: "Beverages & Mocktail Supplies", unit: "kg" },
  { name: "Strawberry jam", category: "Beverages & Mocktail Supplies", unit: "kg" },
  { name: "Mixed berry jam", category: "Beverages & Mocktail Supplies", unit: "kg" },
  { name: "Passionfruit jam", category: "Beverages & Mocktail Supplies", unit: "kg" },
  { name: "Grenadine syrup", category: "Beverages & Mocktail Supplies", unit: "bottle" },
  { name: "Blue raspberry syrup (Monin/Torani)", category: "Beverages & Mocktail Supplies", unit: "bottle" },
  { name: "White grape juice", category: "Beverages & Mocktail Supplies", unit: "litre" },
  { name: "Lychee (canned, in syrup)", category: "Beverages & Mocktail Supplies", unit: "tin" },
  { name: "Butterfly pea flower (dried)", category: "Beverages & Mocktail Supplies", unit: "g" },
  { name: "Date syrup (pure)", category: "Beverages & Mocktail Supplies", unit: "litre" },
  { name: "Chia seeds", category: "Beverages & Mocktail Supplies", unit: "kg" },
  { name: "Edible flowers (assorted, garnish)", category: "Beverages & Mocktail Supplies", unit: "pack" },

  // Disposables & Packaging
  { name: "Aluminium foil trays", category: "Disposables & Packaging", unit: "pcs" },
  { name: "Aluminium foil (rolls)", category: "Disposables & Packaging", unit: "roll" },
  { name: "Cling film (rolls)", category: "Disposables & Packaging", unit: "roll" },
  { name: "Greaseproof/baking paper (rolls)", category: "Disposables & Packaging", unit: "roll" },
  { name: "Disposable gloves", category: "Disposables & Packaging", unit: "box" },
  { name: "Skewers (wooden, disposable)", category: "Disposables & Packaging", unit: "pack" },
  { name: "Charcoal (grill)", category: "Disposables & Packaging", unit: "kg" },

  // Cleaning & Hygiene
  { name: "Hand soap (kitchen)", category: "Cleaning & Hygiene", unit: "bottle" },
  { name: "Dish soap (commercial)", category: "Cleaning & Hygiene", unit: "bottle" },
  { name: "Sanitiser spray", category: "Cleaning & Hygiene", unit: "bottle" },
  { name: "Bin liners (heavy duty)", category: "Cleaning & Hygiene", unit: "pack" },
];

type SeedMenuItem = { name: string; category: string };

// The sellable dishes/drinks customers order, distinct from the raw
// ingredients above - used for the supervisor's end-of-day sales-by-item log.
const MENU_ITEMS: SeedMenuItem[] = [
  { name: "Chicken Shawarma Platter", category: "Food" },
  { name: "Beef Shawarma Platter", category: "Food" },
  { name: "Lamb Mandi", category: "Food" },
  { name: "Chicken Mandi", category: "Food" },
  { name: "Mixed Grill Platter", category: "Food" },
  { name: "Kibbeh", category: "Food" },
  { name: "Hummus", category: "Food" },
  { name: "Falafel", category: "Food" },
  { name: "Fattoush Salad", category: "Food" },
  { name: "Manaish (Za'atar)", category: "Food" },
  { name: "Tabbouleh", category: "Food" },
  { name: "Basbousa", category: "Desserts" },
  { name: "Oum Ali", category: "Desserts" },
  { name: "Kunafa", category: "Desserts" },
  { name: "Qatayef", category: "Desserts" },
  { name: "Karak Tea", category: "Drinks" },
  { name: "Arabian Black Tea", category: "Drinks" },
  { name: "Fresh Mint Lemonade", category: "Drinks" },
  { name: "Mango Milkshake", category: "Drinks" },
  { name: "Pistachio Milkshake", category: "Drinks" },
  { name: "Rose Mocktail", category: "Drinks" },
  { name: "Desert Bloom Mocktail", category: "Drinks" },
  { name: "Bahr Al Asfar Mocktail", category: "Drinks" },
  { name: "Tamr Al Layl Mocktail", category: "Drinks" },
  { name: "Shams Al Ahmar Mocktail", category: "Drinks" },
];

const VENDORS = ["Kano Central Market", "Sabo Meat Suppliers", "Al-Waha Wholesale Grocers", "Sahara Beverages Ltd"];

const RECIPIENTS: { name: string; team: Team }[] = [
  { name: "Ahmed (Head Chef)", team: "KITCHEN" },
  { name: "Fatima (Line Cook)", team: "KITCHEN" },
  { name: "Yusuf (Bartender)", team: "BAR" },
  { name: "Amina (Cleaning Supervisor)", team: "CLEANING" },
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

  console.log(`Seeding ${VENDORS.length} vendors...`);
  for (const name of VENDORS) {
    await prisma.vendor.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log(`Seeding ${RECIPIENTS.length} recipients...`);
  for (const r of RECIPIENTS) {
    const existing = await prisma.recipient.findFirst({ where: { name: r.name } });
    if (!existing) {
      await prisma.recipient.create({ data: { name: r.name, team: r.team } });
    }
  }

  console.log(`Seeding ${MENU_ITEMS.length} menu items...`);
  for (const menuItem of MENU_ITEMS) {
    await prisma.menuItem.upsert({
      where: { name: menuItem.name },
      update: { category: menuItem.category },
      create: { name: menuItem.name, category: menuItem.category },
    });
  }

  const demoUsers: { name: string; pin: string; role: Role }[] = [
    { name: "Storekeeper", pin: "1111", role: "STOREKEEPER" },
    { name: "Kitchen Staff", pin: "2222", role: "KITCHEN" },
    { name: "Bar Staff", pin: "3333", role: "BAR" },
    { name: "Manager", pin: "9999", role: "MANAGER" },
    { name: "Supervisor", pin: "4444", role: "SUPERVISOR" },
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
    "Done. Demo PINs -> Storekeeper: 1111, Kitchen Staff: 2222, Bar Staff: 3333, Manager: 9999, Supervisor: 4444"
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
