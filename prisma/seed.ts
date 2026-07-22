import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedItem = { name: string; category: string; unit: string };

// Deduplicated from Mishkak_All_Items_Blank_Unit_Price.xlsx (~230 recipe-costing
// rows collapsed into one row per real-world stock item).
const ITEMS: SeedItem[] = [
  // Meat & Poultry
  { name: "Whole lamb (bone-in)", category: "Meat & Poultry", unit: "kg" },
  { name: "Goat meat (bone-in)", category: "Meat & Poultry", unit: "kg" },
  { name: "Minced lamb/beef", category: "Meat & Poultry", unit: "kg" },
  { name: "Whole chicken", category: "Meat & Poultry", unit: "kg" },
  { name: "Chicken wings", category: "Meat & Poultry", unit: "kg" },
  { name: "Chicken thighs/breast (Shawarma)", category: "Meat & Poultry", unit: "kg" },
  { name: "Beef (Shawarma)", category: "Meat & Poultry", unit: "kg" },
  { name: "Lebanese sausage (Soujouk)", category: "Meat & Poultry", unit: "kg" },
  { name: "Lamb/chicken bones (stock)", category: "Meat & Poultry", unit: "kg" },

  // Fish & Seafood
  { name: "Whole fish (sea bass/tilapia)", category: "Fish & Seafood", unit: "kg" },

  // Rice, Grains & Legumes
  { name: "Basmati rice", category: "Rice, Grains & Legumes", unit: "kg" },
  { name: "Chickpeas (dried)", category: "Rice, Grains & Legumes", unit: "kg" },
  { name: "Plain flour", category: "Rice, Grains & Legumes", unit: "kg" },
  { name: "Semolina (fine)", category: "Rice, Grains & Legumes", unit: "kg" },
  { name: "Dried yeast", category: "Rice, Grains & Legumes", unit: "g" },
  { name: "Baking powder", category: "Rice, Grains & Legumes", unit: "g" },
  { name: "Cornstarch", category: "Rice, Grains & Legumes", unit: "g" },
  { name: "Sesame seeds (white)", category: "Rice, Grains & Legumes", unit: "kg" },

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

  // Spices & Seasonings
  { name: "Cumin (ground)", category: "Spices & Seasonings", unit: "g" },
  { name: "Coriander (ground)", category: "Spices & Seasonings", unit: "g" },
  { name: "Turmeric", category: "Spices & Seasonings", unit: "g" },
  { name: "Black pepper", category: "Spices & Seasonings", unit: "g" },
  { name: "White pepper", category: "Spices & Seasonings", unit: "g" },
  { name: "Cinnamon (ground)", category: "Spices & Seasonings", unit: "g" },
  { name: "Cinnamon sticks", category: "Spices & Seasonings", unit: "g" },
  { name: "Cardamom (ground)", category: "Spices & Seasonings", unit: "g" },
  { name: "Cardamom pods (whole)", category: "Spices & Seasonings", unit: "g" },
  { name: "Cloves (whole)", category: "Spices & Seasonings", unit: "g" },
  { name: "Allspice/baharat", category: "Spices & Seasonings", unit: "g" },
  { name: "Loomi/dried black lime", category: "Spices & Seasonings", unit: "g" },
  { name: "Saffron", category: "Spices & Seasonings", unit: "g" },
  { name: "Bay leaves", category: "Spices & Seasonings", unit: "g" },
  { name: "Nutmeg (ground)", category: "Spices & Seasonings", unit: "g" },
  { name: "Paprika (sweet)", category: "Spices & Seasonings", unit: "g" },
  { name: "Smoked paprika", category: "Spices & Seasonings", unit: "g" },
  { name: "Chilli flakes", category: "Spices & Seasonings", unit: "g" },
  { name: "Ginger (ground)", category: "Spices & Seasonings", unit: "g" },
  { name: "Sumac", category: "Spices & Seasonings", unit: "g" },
  { name: "Za'atar (dried blend)", category: "Spices & Seasonings", unit: "kg" },
  { name: "Nigella seeds", category: "Spices & Seasonings", unit: "g" },
  { name: "Vanilla extract", category: "Spices & Seasonings", unit: "ml" },
  { name: "Karak tea spice blend", category: "Spices & Seasonings", unit: "g" },
  { name: "Salt", category: "Spices & Seasonings", unit: "kg" },

  // Fresh Produce
  { name: "Onions (yellow)", category: "Fresh Produce", unit: "kg" },
  { name: "Garlic (fresh)", category: "Fresh Produce", unit: "kg" },
  { name: "Ginger (fresh)", category: "Fresh Produce", unit: "kg" },
  { name: "Tomatoes (fresh)", category: "Fresh Produce", unit: "kg" },
  { name: "Fresh coriander", category: "Fresh Produce", unit: "bunch" },
  { name: "Fresh parsley", category: "Fresh Produce", unit: "bunch" },
  { name: "Fresh mint", category: "Fresh Produce", unit: "bunch" },
  { name: "Bell peppers (red)", category: "Fresh Produce", unit: "kg" },
  { name: "Bell peppers (green)", category: "Fresh Produce", unit: "kg" },
  { name: "Chilli peppers (fresh red)", category: "Fresh Produce", unit: "kg" },
  { name: "Courgette/zucchini", category: "Fresh Produce", unit: "kg" },
  { name: "Aubergine/eggplant", category: "Fresh Produce", unit: "kg" },
  { name: "Carrots", category: "Fresh Produce", unit: "kg" },
  { name: "Potatoes", category: "Fresh Produce", unit: "kg" },
  { name: "Cucumber", category: "Fresh Produce", unit: "kg" },
  { name: "Lettuce", category: "Fresh Produce", unit: "kg" },
  { name: "Spring onions", category: "Fresh Produce", unit: "bunch" },

  // Fruits
  { name: "Lemons", category: "Fruits", unit: "kg" },
  { name: "Limes", category: "Fruits", unit: "kg" },
  { name: "Pineapple (fresh or tinned)", category: "Fruits", unit: "kg" },
  { name: "Oranges (fresh, for juicing)", category: "Fruits", unit: "kg" },
  { name: "Mango pulp", category: "Fruits", unit: "kg" },
  { name: "Mixed fruit puree", category: "Fruits", unit: "kg" },
  { name: "Dates (pitted, garnish)", category: "Fruits", unit: "kg" },
  { name: "Dates - Medjool", category: "Fruits", unit: "kg" },

  // Bread & Pastry
  { name: "Arabic flatbread", category: "Bread & Pastry", unit: "pcs" },
  { name: "Sambuusa pastry wrappers", category: "Bread & Pastry", unit: "pack" },
  { name: "Kadaif/knafeh pastry shreds", category: "Bread & Pastry", unit: "kg" },
  { name: "Filo pastry sheets", category: "Bread & Pastry", unit: "pack" },

  // Nuts & Dried Fruits
  { name: "Pine nuts", category: "Nuts & Dried Fruits", unit: "kg" },
  { name: "Almonds (blanched)", category: "Nuts & Dried Fruits", unit: "kg" },
  { name: "Raisins", category: "Nuts & Dried Fruits", unit: "kg" },
  { name: "Pistachios (shelled)", category: "Nuts & Dried Fruits", unit: "kg" },
  { name: "Walnuts (shelled)", category: "Nuts & Dried Fruits", unit: "kg" },
  { name: "Mixed nuts (assorted)", category: "Nuts & Dried Fruits", unit: "kg" },
  { name: "Desiccated coconut", category: "Nuts & Dried Fruits", unit: "kg" },
  { name: "Pistachio paste", category: "Nuts & Dried Fruits", unit: "kg" },

  // Sauces, Pastes & Condiments
  { name: "Tomato paste", category: "Sauces, Pastes & Condiments", unit: "tin" },
  { name: "Tomato sauce (tinned)", category: "Sauces, Pastes & Condiments", unit: "tin" },
  { name: "Tahini", category: "Sauces, Pastes & Condiments", unit: "kg" },
  { name: "Hot sauce/Tabasco", category: "Sauces, Pastes & Condiments", unit: "bottle" },
  { name: "Garlic paste", category: "Sauces, Pastes & Condiments", unit: "kg" },
  { name: "Muhammara paste", category: "Sauces, Pastes & Condiments", unit: "kg" },
  { name: "Pomegranate molasses", category: "Sauces, Pastes & Condiments", unit: "bottle" },
  { name: "Pickled cucumbers", category: "Sauces, Pastes & Condiments", unit: "kg" },
  { name: "Pickled turnip (pink)", category: "Sauces, Pastes & Condiments", unit: "kg" },
  { name: "Pickled green chillies", category: "Sauces, Pastes & Condiments", unit: "kg" },
  { name: "White vinegar", category: "Sauces, Pastes & Condiments", unit: "litre" },
  { name: "Honey", category: "Sauces, Pastes & Condiments", unit: "kg" },
  { name: "Rose water", category: "Sauces, Pastes & Condiments", unit: "ml" },
  { name: "Orange blossom water", category: "Sauces, Pastes & Condiments", unit: "ml" },
  { name: "Rose syrup", category: "Sauces, Pastes & Condiments", unit: "bottle" },
  { name: "Sugar syrup", category: "Sauces, Pastes & Condiments", unit: "litre" },
  { name: "Mastic/gum arabic", category: "Sauces, Pastes & Condiments", unit: "g" },
  { name: "Sugar (white)", category: "Sauces, Pastes & Condiments", unit: "kg" },

  // Beverage Ingredients
  { name: "Loose-leaf mint tea", category: "Beverage Ingredients", unit: "kg" },
  { name: "Arabian black tea (loose leaf)", category: "Beverage Ingredients", unit: "kg" },
  { name: "Chicken stock/bouillon", category: "Beverage Ingredients", unit: "pack" },
  { name: "Lamb stock/bouillon", category: "Beverage Ingredients", unit: "pack" },
  { name: "Soft drinks (assorted cases)", category: "Beverage Ingredients", unit: "case" },
  { name: "Still water (600ml bottles)", category: "Beverage Ingredients", unit: "case" },

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

  // Tableware & Serviceware
  { name: "Service plates (large)", category: "Tableware & Serviceware", unit: "pcs" },
  { name: "Service plates (medium)", category: "Tableware & Serviceware", unit: "pcs" },
  { name: "Service plates (small)", category: "Tableware & Serviceware", unit: "pcs" },
  { name: "Serving bowls (large)", category: "Tableware & Serviceware", unit: "pcs" },
  { name: "Serving bowls (medium)", category: "Tableware & Serviceware", unit: "pcs" },
  { name: "Serving bowls (small)", category: "Tableware & Serviceware", unit: "pcs" },
  { name: "Tea cups (Arabic handle-less)", category: "Tableware & Serviceware", unit: "pcs" },
  { name: "Tea glasses", category: "Tableware & Serviceware", unit: "pcs" },
  { name: "Tea pots (Arabic dallah, large)", category: "Tableware & Serviceware", unit: "pcs" },
  { name: "Tea pots (standard, small)", category: "Tableware & Serviceware", unit: "pcs" },
  { name: "Juice glasses (tall)", category: "Tableware & Serviceware", unit: "pcs" },
  { name: "Water glasses", category: "Tableware & Serviceware", unit: "pcs" },
  { name: "Milkshake glasses (tall)", category: "Tableware & Serviceware", unit: "pcs" },

  // Kitchen Equipment
  { name: "Big cooking pots (50 litre)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Big cooking pots (30 litre)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Sauce pans (small, 5 litre)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Pressure cooker (large, 20+ litre)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Pressure cooker (medium, 10 litre)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Deep fryer (commercial)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Frying pans (large)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Frying pans (small)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Grill pan (flat iron)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Stockpot/bone broth pot (60 litre)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Colander/strainer (large)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Mixing bowls set (large/med/small)", category: "Kitchen Equipment", unit: "set" },
  { name: "Ladles (large)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Serving spoons (large)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Wooden spoons", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Tongs (metal, grill)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Spatulas (flat, metal)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Knives (chef, large)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Knives (boning)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Knife sharpener", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Chopping boards (large, colour-coded)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Skewers (flat metal, grill)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Mortar and pestle (large)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Blender (commercial)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Hand blender (stick)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Food processor", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Juicer (commercial)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Kitchen scales (digital)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Thermometer (meat/food)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Falafel scoop/mould", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Rolling pin", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Baking trays (sheet pans)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Grill grates (outdoor charcoal)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Aprons (kitchen)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Aprons (service/front of house)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Food storage containers (large)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Food storage containers (medium)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Food storage containers (small)", category: "Kitchen Equipment", unit: "pcs" },
  { name: "Squeeze bottles (for sauces)", category: "Kitchen Equipment", unit: "pcs" },
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
    { name: "Kitchen Staff", pin: "2222", role: "KITCHEN_BAR" },
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

  console.log("Done. Demo PINs -> Storekeeper: 1111, Kitchen Staff: 2222, Manager: 9999");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
