import { unstable_cache, revalidateTag as nextRevalidateTag } from "next/cache";
import { prisma } from "./prisma";

// ─── Cache tag constants ───────────────────────────────────────────────────
export const CACHE_TAGS = {
  items: "items",
  categories: "categories",
  item: (slug: string) => `item-${slug}`,
} as const;

// Next.js 16 requires a second `profile` argument — wrap once here
export function invalidateTag(...tags: string[]) {
  tags.forEach((tag) => nextRevalidateTag(tag, {}));
}

// ─── Shared query options ──────────────────────────────────────────────────
const APPROVED_LISTING = { isActive: true, status: "APPROVED" as const };

// ─── Home page ─────────────────────────────────────────────────────────────
export const getCachedFeaturedItems = unstable_cache(
  async () => {
    const items = await prisma.item.findMany({
      where: { listings: { some: APPROVED_LISTING } },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        category: { select: { id: true, name: true, slug: true } },
        _count: {
          select: { listings: { where: APPROVED_LISTING } },
        },
        listings: {
          where: APPROVED_LISTING,
          select: { priceOptions: { select: { price: true }, orderBy: { price: "asc" }, take: 1 } },
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
  },
  ["featured-items"],
  { revalidate: 60, tags: [CACHE_TAGS.items] }
);

export const getCachedHomeCategories = unstable_cache(
  async () =>
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        _count: {
          select: {
            items: { where: { listings: { some: APPROVED_LISTING } } },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ["home-categories"],
  { revalidate: 60, tags: [CACHE_TAGS.categories] }
);

// ─── Products list page ─────────────────────────────────────────────────────
interface ProductSearchParams {
  category?: string;
  search?: string;
  mode?: string;
  minPrice?: string;
  maxPrice?: string;
}

export const getCachedProductItems = unstable_cache(
  async (params: ProductSearchParams) => {
    const { category, search, mode, minPrice, maxPrice } = params;
    const priceMode = mode === "RETAIL" ? "RETAIL" : "BULK";

    const priceOptionFilter: Record<string, unknown> = { mode: priceMode };
    if (minPrice) priceOptionFilter.price = { ...((priceOptionFilter.price as object) || {}), gte: parseFloat(minPrice) };
    if (maxPrice) priceOptionFilter.price = { ...((priceOptionFilter.price as object) || {}), lte: parseFloat(maxPrice) };

    const listingFilter = { isActive: true, status: "APPROVED" as const, priceOptions: { some: priceOptionFilter } };

    const items = await prisma.item.findMany({
      where: {
        ...(category ? { category: { slug: category } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { category: { name: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
        listings: { some: listingFilter },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { listings: { where: listingFilter } } },
        listings: {
          where: listingFilter,
          select: { priceOptions: { where: priceOptionFilter, select: { price: true }, orderBy: { price: "asc" }, take: 1 } },
          take: 1,
        },
      },
      orderBy: { name: "asc" },
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
  },
  ["product-items"],
  { revalidate: 30, tags: [CACHE_TAGS.items] }
);

export const getCachedProductCategories = unstable_cache(
  async (priceMode: "RETAIL" | "BULK") =>
    prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            items: {
              where: {
                listings: {
                  some: { isActive: true, status: "APPROVED", priceOptions: { some: { mode: priceMode } } },
                },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    }),
  ["product-categories"],
  { revalidate: 30, tags: [CACHE_TAGS.categories] }
);

// ─── Item detail page ───────────────────────────────────────────────────────
export const getCachedItemDetail = unstable_cache(
  async (slug: string) => {
    const item = await prisma.item.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!item) return null;

    const listings = await prisma.listing.findMany({
      where: { itemId: item.id, isActive: true, status: "APPROVED" },
      select: {
        id: true,
        name: true,
        brand: true,
        description: true,
        imageUrl: true,
        priceOptions: {
          select: { id: true, weight: true, price: true, stock: true, mode: true, minQty: true },
          orderBy: { price: "asc" },
        },
        seller: { select: { id: true, name: true, businessName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return { item, listings };
  },
  ["item-detail"],
  { revalidate: 60, tags: [CACHE_TAGS.items] }
);

// ─── All item slugs (for generateStaticParams) ─────────────────────────────
export const getAllItemSlugs = unstable_cache(
  async () => prisma.item.findMany({ select: { slug: true } }),
  ["item-slugs"],
  { revalidate: 3600, tags: [CACHE_TAGS.items] }
);
