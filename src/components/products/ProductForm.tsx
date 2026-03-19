"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const priceOptionSchema = z.object({
  weight: z.string().min(1, "Required"),
  price: z.coerce.number().positive("Must be > 0"),
  stock: z.coerce.number().int().min(0, "Must be ≥ 0"),
});

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  brand: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  categoryId: z.string().min(1, "Select a category"),
  priceOptions: z.array(priceOptionSchema).min(1, "Add at least one price option"),
});

export type ProductFormData = z.infer<typeof schema>;

interface Category {
  id: string;
  name: string;
}

interface Props {
  categories: Category[];
  defaultValues?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  loading?: boolean;
  submitLabel?: string;
}

export default function ProductForm({
  categories,
  defaultValues,
  onSubmit,
  loading,
  submitLabel = "Save Product",
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      brand: "",
      description: "",
      imageUrl: "",
      categoryId: "",
      priceOptions: [{ weight: "", price: 0, stock: 10 }],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "priceOptions",
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Product Name *</Label>
          <Input placeholder="e.g. Basmati Rice" {...register("name")} />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Brand</Label>
          <Input placeholder="e.g. India Gate" {...register("brand")} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Category *</Label>
        <select
          {...register("categoryId")}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select a category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <textarea
          {...register("description")}
          rows={3}
          placeholder="Describe your product..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Image URL</Label>
        <Input placeholder="https://..." {...register("imageUrl")} />
        {errors.imageUrl && <p className="text-xs text-red-500">{errors.imageUrl.message}</p>}
      </div>

      {/* Price options */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Price Options *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ weight: "", price: 0, stock: 10 })}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Option
          </Button>
        </div>
        {errors.priceOptions && (
          <p className="text-xs text-red-500">{errors.priceOptions.message}</p>
        )}

        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  placeholder="Weight (e.g. 1kg, 500g)"
                  {...register(`priceOptions.${index}.weight`)}
                />
                {errors.priceOptions?.[index]?.weight && (
                  <p className="text-xs text-red-500 mt-0.5">{errors.priceOptions[index].weight?.message}</p>
                )}
              </div>
              <div className="w-28">
                <Input
                  type="number"
                  placeholder="Price (e.g. 250)"
                  {...register(`priceOptions.${index}.price`)}
                />
                {errors.priceOptions?.[index]?.price && (
                  <p className="text-xs text-red-500 mt-0.5">{errors.priceOptions[index].price?.message}</p>
                )}
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  placeholder="Stock (e.g. 100)"
                  {...register(`priceOptions.${index}.stock`)}
                />
              </div>
              <button
                type="button"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                className="mt-2 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">Weight · Price (₹) · Stock quantity</p>
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
