import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import CategoriesSection from "@/components/landing/CategoriesSection";
import FeaturedProducts from "@/components/landing/FeaturedProducts";
import HowItWorks from "@/components/landing/HowItWorks";
import AboutSection from "@/components/landing/AboutSection";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

async function getFeaturedItems() {
  const items = await prisma.item.findMany({
    where: {
      listings: {
        some: { isActive: true, status: "APPROVED" },
      },
    },
    include: {
      category: true,
      _count: {
        select: {
          listings: { where: { isActive: true, status: "APPROVED" } },
        },
      },
      listings: {
        where: { isActive: true, status: "APPROVED" },
        include: {
          priceOptions: { orderBy: { price: "asc" }, take: 1 },
        },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
    take: 8,
  });

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    imageUrl: item.imageUrl,
    category: item.category,
    sellerCount: item._count.listings,
    lowestPrice: item.listings[0]?.priceOptions[0]?.price ?? null,
  }));
}

async function getCategories() {
  return prisma.category.findMany({
    include: {
      _count: {
        select: {
          items: {
            where: { listings: { some: { isActive: true, status: "APPROVED" } } },
          },
        },
      },
    },
  });
}

export default async function HomePage() {
  const [items, categories] = await Promise.all([
    getFeaturedItems(),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <CategoriesSection categories={categories} />
        <FeaturedProducts items={items} />
        <HowItWorks />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
}
