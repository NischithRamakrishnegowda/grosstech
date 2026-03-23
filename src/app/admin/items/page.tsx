import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ItemManager from "@/components/admin/ItemManager";

export default async function AdminItemsPage() {
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
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <ItemManager
      initialItems={JSON.parse(JSON.stringify(items))}
      categories={JSON.parse(JSON.stringify(categories))}
    />
  );
}
