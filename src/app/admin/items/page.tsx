import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CatalogTabs from "./CatalogTabs";

export default async function AdminCatalogPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/login");

  const [items, categories] = await Promise.all([
    prisma.item.findMany({
      include: {
        category: true,
        _count: { select: { listings: true } },
      },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.category.findMany({
      include: { _count: { select: { items: true, listings: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <CatalogTabs
      items={JSON.parse(JSON.stringify(items))}
      categories={JSON.parse(JSON.stringify(categories))}
    />
  );
}
