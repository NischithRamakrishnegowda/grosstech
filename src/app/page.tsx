import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/landing/HeroSection";
import CategoriesSection from "@/components/landing/CategoriesSection";
import FeaturedProducts from "@/components/landing/FeaturedProducts";
import HowItWorks from "@/components/landing/HowItWorks";
import AboutSection from "@/components/landing/AboutSection";
import { getCachedFeaturedItems, getCachedHomeCategories } from "@/lib/cache";

export default async function HomePage() {
  const [items, categories] = await Promise.all([
    getCachedFeaturedItems(),
    getCachedHomeCategories(),
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
