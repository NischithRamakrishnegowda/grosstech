/**
 * Seed script — categories and items catalog only.
 * Images are NOT seeded — admin uploads them via the admin panel → Vercel Blob.
 * Run: export $(grep -v '^#' .env | xargs) && npx tsx prisma/seed.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CATALOG: {
  category: { name: string; slug: string };
  items: { name: string; slug: string }[];
}[] = [
  {
    category: { name: "Grains", slug: "grains" },
    items: [
      { name: "Wheat (Lokwan)", slug: "wheat-lokwan" },
      { name: "Wheat (Sharbati)", slug: "wheat-sharbati" },
      { name: "Ragi (Finger Millet)", slug: "ragi" },
      { name: "Ragi GPU-28", slug: "ragi-gpu-28" },
      { name: "Ragi MR-6", slug: "ragi-mr-6" },
      { name: "Maize (Yellow Corn)", slug: "maize-yellow" },
      { name: "Jowar (Sorghum)", slug: "jowar" },
      { name: "Bajra (Pearl Millet)", slug: "bajra" },
      { name: "Barley", slug: "barley" },
    ],
  },
  {
    category: { name: "Rice", slug: "rice" },
    items: [
      { name: "Basmati Rice", slug: "basmati-rice" },
      { name: "Sona Masuri Rice", slug: "sona-masuri-rice" },
      { name: "Ponni Rice", slug: "ponni-rice" },
      { name: "Kolam Rice", slug: "kolam-rice" },
      { name: "Red Rice", slug: "red-rice" },
      { name: "Brown Rice", slug: "brown-rice" },
      { name: "Idli Rice (Boiled)", slug: "idli-rice" },
      { name: "Raw Rice", slug: "raw-rice" },
    ],
  },
  {
    category: { name: "Millets", slug: "millets" },
    items: [
      { name: "Foxtail Millet (Navane)", slug: "foxtail-millet" },
      { name: "Kodo Millet (Harka)", slug: "kodo-millet" },
      { name: "Little Millet (Saame)", slug: "little-millet" },
      { name: "Barnyard Millet (Oodalu)", slug: "barnyard-millet" },
      { name: "Proso Millet (Baragu)", slug: "proso-millet" },
      { name: "Browntop Millet", slug: "browntop-millet" },
    ],
  },
  {
    category: { name: "Pulses & Dal", slug: "pulses" },
    items: [
      { name: "Toor Dal (Arhar)", slug: "toor-dal" },
      { name: "Moong Dal (Yellow Split)", slug: "moong-dal-yellow" },
      { name: "Moong Dal (Green Whole)", slug: "moong-dal-green" },
      { name: "Chana Dal", slug: "chana-dal" },
      { name: "Urad Dal (Black Whole)", slug: "urad-dal-black" },
      { name: "Urad Dal (White Split)", slug: "urad-dal-white" },
      { name: "Masoor Dal (Red)", slug: "masoor-dal-red" },
      { name: "Masoor Dal (Whole)", slug: "masoor-dal-whole" },
      { name: "Rajma (Kidney Beans)", slug: "rajma" },
      { name: "Kabuli Chana (Chickpeas)", slug: "kabuli-chana" },
      { name: "Moth Dal", slug: "moth-dal" },
      { name: "Val Dal (Field Beans)", slug: "val-dal" },
    ],
  },
  {
    category: { name: "Oils", slug: "oil" },
    items: [
      { name: "Groundnut Oil (Cold Pressed)", slug: "groundnut-oil-cold-pressed" },
      { name: "Groundnut Oil (Refined)", slug: "groundnut-oil-refined" },
      { name: "Coconut Oil (Cold Pressed)", slug: "coconut-oil-cold-pressed" },
      { name: "Coconut Oil (Refined)", slug: "coconut-oil-refined" },
      { name: "Sunflower Oil (Refined)", slug: "sunflower-oil-refined" },
      { name: "Mustard Oil", slug: "mustard-oil" },
      { name: "Sesame Oil (Gingelly)", slug: "sesame-oil" },
      { name: "Palm Oil (Refined)", slug: "palm-oil-refined" },
    ],
  },
  {
    category: { name: "Sugar & Jaggery", slug: "sugar" },
    items: [
      { name: "White Sugar (S30)", slug: "white-sugar-s30" },
      { name: "White Sugar (M30)", slug: "white-sugar-m30" },
      { name: "Jaggery Block (Bella)", slug: "jaggery-block" },
      { name: "Jaggery Powder", slug: "jaggery-powder" },
      { name: "Palm Jaggery", slug: "palm-jaggery" },
      { name: "Coconut Sugar", slug: "coconut-sugar" },
    ],
  },
  {
    category: { name: "Spices", slug: "spices" },
    items: [
      { name: "Turmeric Powder", slug: "turmeric-powder" },
      { name: "Turmeric Whole", slug: "turmeric-whole" },
      { name: "Red Chilli Powder", slug: "red-chilli-powder" },
      { name: "Red Chilli Whole", slug: "red-chilli-whole" },
      { name: "Coriander Powder", slug: "coriander-powder" },
      { name: "Coriander Seeds", slug: "coriander-seeds" },
      { name: "Cumin Seeds (Jeera)", slug: "cumin-seeds" },
      { name: "Black Pepper (Whole)", slug: "black-pepper-whole" },
      { name: "Cardamom (Green)", slug: "cardamom-green" },
      { name: "Cloves (Lavang)", slug: "cloves" },
      { name: "Cinnamon (Dalchini)", slug: "cinnamon" },
      { name: "Mustard Seeds", slug: "mustard-seeds" },
      { name: "Fenugreek Seeds (Methi)", slug: "fenugreek-seeds" },
      { name: "Asafoetida (Hing)", slug: "asafoetida" },
      { name: "Garam Masala", slug: "garam-masala" },
      { name: "Sambar Powder", slug: "sambar-powder" },
      { name: "Rasam Powder", slug: "rasam-powder" },
    ],
  },
  {
    category: { name: "Flours", slug: "flours" },
    items: [
      { name: "Wheat Flour (Atta)", slug: "wheat-flour-atta" },
      { name: "Maida (Refined Flour)", slug: "maida" },
      { name: "Besan (Chickpea Flour)", slug: "besan" },
      { name: "Rice Flour", slug: "rice-flour" },
      { name: "Ragi Flour", slug: "ragi-flour" },
      { name: "Jowar Flour", slug: "jowar-flour" },
      { name: "Bajra Flour", slug: "bajra-flour" },
      { name: "Corn Flour", slug: "corn-flour" },
      { name: "Sooji (Semolina Coarse)", slug: "sooji-coarse" },
      { name: "Rava (Semolina Fine)", slug: "rava-fine" },
    ],
  },
  {
    category: { name: "Dry Fruits & Nuts", slug: "dry-fruits" },
    items: [
      { name: "Cashews (W180)", slug: "cashews-w180" },
      { name: "Cashews (W240)", slug: "cashews-w240" },
      { name: "Almonds", slug: "almonds" },
      { name: "Groundnuts (Raw)", slug: "groundnuts-raw" },
      { name: "Groundnuts (Roasted)", slug: "groundnuts-roasted" },
      { name: "Raisins (Kishmish)", slug: "raisins" },
      { name: "Dates (Khajoor)", slug: "dates" },
      { name: "Sesame Seeds (White)", slug: "sesame-seeds-white" },
      { name: "Sesame Seeds (Black)", slug: "sesame-seeds-black" },
      { name: "Desiccated Coconut", slug: "desiccated-coconut" },
    ],
  },
];

async function main() {
  console.log("Seeding catalog — categories and items (no images, no users)...\n");

  let createdCats = 0, skippedCats = 0, createdItems = 0, skippedItems = 0;

  for (const { category, items } of CATALOG) {
    const cat = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: { name: category.name, slug: category.slug },
    });

    const isNew = !(await prisma.category.findFirst({ where: { slug: category.slug, createdAt: { lt: new Date() } } }));
    if (isNew) { createdCats++; console.log(`[+] ${category.name}`); }
    else { skippedCats++; console.log(`[=] ${category.name}`); }

    for (const item of items) {
      const existing = await prisma.item.findUnique({ where: { slug: item.slug } });
      if (existing) {
        skippedItems++;
      } else {
        await prisma.item.create({ data: { name: item.name, slug: item.slug, categoryId: cat.id } });
        createdItems++;
        process.stdout.write("  + " + item.name + "\n");
      }
    }
  }

  console.log(`\n✓ Done`);
  console.log(`  Categories: ${createdCats} created, ${skippedCats} already existed`);
  console.log(`  Items:      ${createdItems} created, ${skippedItems} already existed`);
  console.log(`\n  Images: upload via Admin → Categories / Items panel`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
