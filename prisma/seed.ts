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
  const itemsByCategory: Record<string, { name: string; slug: string; imageUrl: string }[]> = {
    grains: [
      { name: "Rice", slug: "rice", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop" },
      { name: "Wheat", slug: "wheat", imageUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=300&fit=crop" },
      { name: "Ragi", slug: "ragi", imageUrl: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop" },
      { name: "Corn", slug: "corn", imageUrl: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop" },
      { name: "Jowar", slug: "jowar", imageUrl: "https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&h=300&fit=crop" },
      { name: "Bajra", slug: "bajra", imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop&q=80" },
    ],
    sugar: [
      { name: "Refined Sugar", slug: "refined-sugar", imageUrl: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&h=300&fit=crop" },
      { name: "Jaggery", slug: "jaggery", imageUrl: "https://images.unsplash.com/photo-1611243017767-508da8db2b85?w=400&h=300&fit=crop" },
      { name: "Brown Sugar", slug: "brown-sugar", imageUrl: "https://images.unsplash.com/photo-1589135233689-3e0e133f050f?w=400&h=300&fit=crop" },
    ],
    oil: [
      { name: "Sunflower Oil", slug: "sunflower-oil", imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=300&fit=crop" },
      { name: "Groundnut Oil", slug: "groundnut-oil", imageUrl: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=400&h=300&fit=crop" },
      { name: "Coconut Oil", slug: "coconut-oil", imageUrl: "https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400&h=300&fit=crop" },
      { name: "Mustard Oil", slug: "mustard-oil", imageUrl: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&h=300&fit=crop" },
    ],
    pulses: [
      { name: "Toor Dal", slug: "toor-dal", imageUrl: "https://images.unsplash.com/photo-1613743983303-b3e89f8a2b80?w=400&h=300&fit=crop" },
      { name: "Moong Dal", slug: "moong-dal", imageUrl: "https://images.unsplash.com/photo-1612257416648-ee7a6c5b6d70?w=400&h=300&fit=crop" },
      { name: "Chana Dal", slug: "chana-dal", imageUrl: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=300&fit=crop" },
      { name: "Urad Dal", slug: "urad-dal", imageUrl: "https://images.unsplash.com/photo-1613743983303-b3e89f8a2b80?w=400&h=300&fit=crop&q=80" },
      { name: "Masoor Dal", slug: "masoor-dal", imageUrl: "https://images.unsplash.com/photo-1612257416648-ee7a6c5b6d70?w=400&h=300&fit=crop&q=80" },
    ],
    spices: [
      { name: "Turmeric Powder", slug: "turmeric-powder", imageUrl: "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&h=300&fit=crop&q=80" },
      { name: "Red Chilli Powder", slug: "red-chilli-powder", imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=300&fit=crop" },
      { name: "Cumin", slug: "cumin", imageUrl: "https://images.unsplash.com/photo-1599909533287-45014a529c85?w=400&h=300&fit=crop" },
      { name: "Coriander Powder", slug: "coriander-powder", imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=300&fit=crop&q=80" },
      { name: "Garam Masala", slug: "garam-masala", imageUrl: "https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=400&h=300&fit=crop" },
    ],
  };

  const createdItems: Record<string, string> = {};
  for (const [categorySlug, items] of Object.entries(itemsByCategory)) {
    for (const item of items) {
      const created = await prisma.item.upsert({
        where: { slug: item.slug },
        update: { name: item.name, imageUrl: item.imageUrl },
        create: {
          name: item.name,
          slug: item.slug,
          imageUrl: item.imageUrl,
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
