import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import CategoriesSection from "@/components/landing/CategoriesSection";
import FeaturedProducts from "@/components/landing/FeaturedProducts";
import HowItWorks from "@/components/landing/HowItWorks";
import AboutSection from "@/components/landing/AboutSection";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

async function getFeaturedListings() {
  return prisma.listing.findMany({
    where: { isActive: true, status: "APPROVED" },
    include: {
      category: true,
      priceOptions: { orderBy: { price: "asc" }, take: 1 },
      seller: { select: { id: true, name: true, businessName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
}

async function getCategories() {
  return prisma.category.findMany({
    include: { _count: { select: { listings: { where: { isActive: true, status: "APPROVED" } } } } },
  });
}

export default async function HomePage() {
  const [listings, categories] = await Promise.all([
    getFeaturedListings(),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <HeroSection />
        <CategoriesSection categories={categories} />
        <FeaturedProducts listings={listings} />
        <HowItWorks />
        <AboutSection />
      </main>
      <Footer />
    </div>
  );
}
