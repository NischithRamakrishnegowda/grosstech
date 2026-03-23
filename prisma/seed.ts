import "dotenv/config";
import { PrismaClient, Role, ListingSource } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "grosstechbengaluru@gmail.com" },
    update: { phone: "+919008578425", role: Role.ADMIN },
    create: {
      name: "Gross Tech Admin",
      email: "grosstechbengaluru@gmail.com",
      password: adminPassword,
      role: Role.ADMIN,
      phone: "+919008578425",
      street: "42 MG Road, Indiranagar",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560038",
      emailVerified: true,
      phoneVerified: true,
    },
  });

  // Create sample seller
  const sellerPassword = await bcrypt.hash("seller123", 10);
  const seller = await prisma.user.upsert({
    where: { email: "seller@grosstech.com" },
    update: {},
    create: {
      name: "Fresh Farms",
      email: "seller@grosstech.com",
      password: sellerPassword,
      role: Role.SELLER,
      businessName: "Fresh Farms Pvt Ltd",
      phone: "9111111111",
      street: "123 Market St, Jayanagar",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560041",
      upiId: "freshfarms@upi",
    },
  });

  // Create sample buyer
  const buyerPassword = await bcrypt.hash("buyer123", 10);
  await prisma.user.upsert({
    where: { email: "buyer@grosstech.com" },
    update: {},
    create: {
      name: "Ravi Kumar",
      email: "buyer@grosstech.com",
      password: buyerPassword,
      role: Role.BUYER,
      phone: "9222222222",
      street: "56 Residency Road, Shantinagar",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560025",
    },
  });

  // Create categories
  const categories = [
    { name: "Grains", slug: "grains" },
    { name: "Sugar", slug: "sugar" },
    { name: "Oil", slug: "oil" },
    { name: "Pulses", slug: "pulses" },
    { name: "Spices", slug: "spices" },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: cat,
    });
    createdCategories[cat.slug] = created.id;
  }

  // Create predefined items under categories
  const itemsByCategory: Record<string, { name: string; slug: string }[]> = {
    grains: [
      { name: "Rice", slug: "rice" },
      { name: "Wheat", slug: "wheat" },
      { name: "Ragi", slug: "ragi" },
      { name: "Corn", slug: "corn" },
      { name: "Jowar", slug: "jowar" },
      { name: "Bajra", slug: "bajra" },
    ],
    sugar: [
      { name: "Refined Sugar", slug: "refined-sugar" },
      { name: "Jaggery", slug: "jaggery" },
      { name: "Brown Sugar", slug: "brown-sugar" },
    ],
    oil: [
      { name: "Sunflower Oil", slug: "sunflower-oil" },
      { name: "Groundnut Oil", slug: "groundnut-oil" },
      { name: "Coconut Oil", slug: "coconut-oil" },
      { name: "Mustard Oil", slug: "mustard-oil" },
    ],
    pulses: [
      { name: "Toor Dal", slug: "toor-dal" },
      { name: "Moong Dal", slug: "moong-dal" },
      { name: "Chana Dal", slug: "chana-dal" },
      { name: "Urad Dal", slug: "urad-dal" },
      { name: "Masoor Dal", slug: "masoor-dal" },
    ],
    spices: [
      { name: "Turmeric Powder", slug: "turmeric-powder" },
      { name: "Red Chilli Powder", slug: "red-chilli-powder" },
      { name: "Cumin", slug: "cumin" },
      { name: "Coriander Powder", slug: "coriander-powder" },
      { name: "Garam Masala", slug: "garam-masala" },
    ],
  };

  const createdItems: Record<string, string> = {};
  for (const [categorySlug, items] of Object.entries(itemsByCategory)) {
    for (const item of items) {
      const created = await prisma.item.upsert({
        where: { slug: item.slug },
        update: { name: item.name },
        create: {
          name: item.name,
          slug: item.slug,
          categoryId: createdCategories[categorySlug],
        },
      });
      createdItems[item.slug] = created.id;
    }
  }

  // Listings linked to predefined items
  const listings = [
    {
      name: "Basmati Rice",
      brand: "India Gate",
      description: "Premium long-grain basmati rice with aromatic fragrance. Aged 2 years for superior taste.",
      source: ListingSource.ADMIN,
      categoryId: createdCategories["grains"],
      sellerId: admin.id,
      itemId: createdItems["rice"],
      priceOptions: [
        { weight: "500g", price: 65, stock: 100 },
        { weight: "1kg", price: 120, stock: 200 },
        { weight: "5kg", price: 550, stock: 50 },
        { weight: "25kg", price: 2500, stock: 20 },
      ],
    },
    {
      name: "Wheat",
      brand: "Aashirvaad",
      description: "Whole wheat grains, freshly milled. Rich in fiber and perfect for making rotis and bread.",
      source: ListingSource.ADMIN,
      categoryId: createdCategories["grains"],
      sellerId: admin.id,
      itemId: createdItems["wheat"],
      priceOptions: [
        { weight: "1kg", price: 45, stock: 300 },
        { weight: "5kg", price: 210, stock: 100 },
        { weight: "25kg", price: 950, stock: 30 },
      ],
    },
    {
      name: "Ragi",
      brand: "Organic India",
      description: "Finger millet (ragi) — high in calcium and iron. Ideal for porridge, rotis, and health drinks.",
      source: ListingSource.ADMIN,
      categoryId: createdCategories["grains"],
      sellerId: admin.id,
      itemId: createdItems["ragi"],
      priceOptions: [
        { weight: "500g", price: 55, stock: 150 },
        { weight: "1kg", price: 100, stock: 200 },
        { weight: "5kg", price: 480, stock: 50 },
      ],
    },
    {
      name: "Corn",
      brand: null,
      description: "Dried corn kernels, great for popcorn, corn flour, and animal feed. Sourced from local farms.",
      source: ListingSource.ADMIN,
      categoryId: createdCategories["grains"],
      sellerId: admin.id,
      itemId: createdItems["corn"],
      priceOptions: [
        { weight: "1kg", price: 40, stock: 200 },
        { weight: "5kg", price: 185, stock: 80 },
        { weight: "25kg", price: 850, stock: 25 },
      ],
    },
    {
      name: "Refined Sugar",
      brand: "Uttam",
      description: "Pure white refined sugar, ideal for daily use. FSSAI certified, no additives.",
      source: ListingSource.ADMIN,
      categoryId: createdCategories["sugar"],
      sellerId: admin.id,
      itemId: createdItems["refined-sugar"],
      priceOptions: [
        { weight: "500g", price: 30, stock: 200 },
        { weight: "1kg", price: 55, stock: 300 },
        { weight: "5kg", price: 260, stock: 100 },
        { weight: "25kg", price: 1200, stock: 40 },
      ],
    },
    {
      name: "Sunflower Oil",
      brand: "Fortune",
      description: "Light and healthy sunflower oil, rich in Vitamin E. Double refined for purity.",
      source: ListingSource.SELLER,
      categoryId: createdCategories["oil"],
      sellerId: seller.id,
      itemId: createdItems["sunflower-oil"],
      priceOptions: [
        { weight: "500ml", price: 75, stock: 150 },
        { weight: "1L", price: 140, stock: 200 },
        { weight: "5L", price: 680, stock: 60 },
      ],
    },
    {
      name: "Toor Dal",
      brand: "Organic India",
      description: "Premium quality toor dal, protein-rich and easy to cook. Sourced directly from farms.",
      source: ListingSource.SELLER,
      categoryId: createdCategories["pulses"],
      sellerId: seller.id,
      itemId: createdItems["toor-dal"],
      priceOptions: [
        { weight: "500g", price: 75, stock: 100 },
        { weight: "1kg", price: 145, stock: 150 },
        { weight: "5kg", price: 700, stock: 40 },
      ],
    },
    {
      name: "Turmeric Powder",
      brand: "MDH",
      description: "Pure turmeric powder with natural curcumin, no additives. Rich golden color and aroma.",
      source: ListingSource.ADMIN,
      categoryId: createdCategories["spices"],
      sellerId: admin.id,
      itemId: createdItems["turmeric-powder"],
      priceOptions: [
        { weight: "100g", price: 35, stock: 300 },
        { weight: "250g", price: 80, stock: 200 },
        { weight: "500g", price: 150, stock: 100 },
      ],
    },
  ];

  for (const listing of listings) {
    const { priceOptions, ...listingData } = listing;
    const existing = await prisma.listing.findFirst({
      where: { name: listing.name, sellerId: listing.sellerId },
    });
    if (existing) {
      await prisma.listing.update({
        where: { id: existing.id },
        data: {
          imageUrl: null,
          description: listing.description,
          categoryId: listingData.categoryId,
          itemId: listingData.itemId,
        },
      });
    } else {
      await prisma.listing.create({
        data: {
          ...listingData,
          imageUrl: null,
          priceOptions: { create: priceOptions },
        },
      });
    }
  }

  console.log("Seed complete!");
  console.log("Admin:  grosstechbengaluru@gmail.com / admin123");
  console.log("Seller: seller@grosstech.com / seller123");
  console.log("Buyer:  buyer@grosstech.com / buyer123");
  console.log(`Seeded ${Object.keys(createdItems).length} predefined items across ${Object.keys(createdCategories).length} categories`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
