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
    where: { email: "admin@grosstech.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@grosstech.com",
      password: adminPassword,
      role: Role.ADMIN,
      phone: "9000000000",
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
      address: "123 Market St, Bangalore",
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
    },
  });

  // Create categories
  const categories = [
    { name: "Rice", slug: "rice" },
    { name: "Sugar", slug: "sugar" },
    { name: "Oil", slug: "oil" },
    { name: "Pulses", slug: "pulses" },
    { name: "Spices", slug: "spices" },
  ];

  const createdCategories: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    createdCategories[cat.slug] = created.id;
  }

  // Create listings
  const listings = [
    {
      name: "Basmati Rice",
      brand: "India Gate",
      description: "Premium long-grain basmati rice with aromatic fragrance.",
      source: ListingSource.ADMIN,
      categoryId: createdCategories["rice"],
      sellerId: admin.id,
      priceOptions: [
        { weight: "500g", price: 65, stock: 100 },
        { weight: "1kg", price: 120, stock: 200 },
        { weight: "5kg", price: 550, stock: 50 },
        { weight: "25kg", price: 2500, stock: 20 },
      ],
    },
    {
      name: "Refined Sugar",
      brand: "Uttam",
      description: "Pure white refined sugar, ideal for daily use.",
      source: ListingSource.ADMIN,
      categoryId: createdCategories["sugar"],
      sellerId: admin.id,
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
      description: "Light and healthy sunflower oil, rich in Vitamin E.",
      source: ListingSource.SELLER,
      categoryId: createdCategories["oil"],
      sellerId: seller.id,
      priceOptions: [
        { weight: "500ml", price: 75, stock: 150 },
        { weight: "1L", price: 140, stock: 200 },
        { weight: "5L", price: 680, stock: 60 },
      ],
    },
    {
      name: "Toor Dal",
      brand: "Organic India",
      description: "Premium quality toor dal, protein-rich and easy to cook.",
      source: ListingSource.SELLER,
      categoryId: createdCategories["pulses"],
      sellerId: seller.id,
      priceOptions: [
        { weight: "500g", price: 75, stock: 100 },
        { weight: "1kg", price: 145, stock: 150 },
        { weight: "5kg", price: 700, stock: 40 },
      ],
    },
    {
      name: "Turmeric Powder",
      brand: "MDH",
      description: "Pure turmeric powder with natural curcumin, no additives.",
      source: ListingSource.ADMIN,
      categoryId: createdCategories["spices"],
      sellerId: admin.id,
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
    if (!existing) {
      await prisma.listing.create({
        data: {
          ...listingData,
          priceOptions: { create: priceOptions },
        },
      });
    }
  }

  console.log("Seed complete!");
  console.log("Admin:  admin@grosstech.com / admin123");
  console.log("Seller: seller@grosstech.com / seller123");
  console.log("Buyer:  buyer@grosstech.com / buyer123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
