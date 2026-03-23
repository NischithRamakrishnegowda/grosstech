"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect } from "react";

const priceOptionSchema = z.object({
  weight: z.string().min(1, "Required"),
  price: z.coerce.number().positive("Must be > 0"),
  stock: z.coerce.number().int().min(0, "Must be ≥ 0"),
  mode: z.enum(["RETAIL", "BULK"]),
  minQty: z.coerce.number().int().min(1),
});

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  brand: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional().or(z.literal("")),
  categoryId: z.string().min(1, "Select a category"),
  itemId: z.string().min(1, "Select an item"),
  priceOptions: z.array(priceOptionSchema).min(1, "Add at least one price option"),
});

export type ProductFormData = z.infer<typeof schema>;

interface Category {
  id: string;
  name: string;
}

interface ItemOption {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
}

interface Props {
  categories: Category[];
  items: ItemOption[];
  defaultValues?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  loading?: boolean;
  submitLabel?: string;
}

const BULK_WEIGHT_SUGGESTIONS = ["25kg bag", "50kg bag", "100kg bag"];
const RETAIL_WEIGHT_SUGGESTIONS = ["100g", "250g", "500g", "1kg", "5kg"];

export default function ProductForm({
  categories,
  items,
  defaultValues,
  onSubmit,
  loading,
  submitLabel = "Save Product",
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      brand: "",
      description: "",
      imageUrl: "",
      categoryId: "",
      itemId: "",
      priceOptions: [{ weight: "", price: "" as unknown as number, stock: "" as unknown as number, mode: "RETAIL", minQty: 1 }],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "priceOptions" });

  const selectedCategoryId = watch("categoryId");
  const selectedItemId = watch("itemId");

  // Filter items by selected category
  const filteredItems = items.filter((item) => item.categoryId === selectedCategoryId);

  // Auto-set name when item is selected
  useEffect(() => {
    if (selectedItemId) {
      const item = items.find((i) => i.id === selectedItemId);
      if (item) setValue("name", item.name);
    }
  }, [selectedItemId, items, setValue]);

  // Reset item when category changes (only if current item doesn't belong to new category)
  useEffect(() => {
    if (selectedCategoryId && selectedItemId) {
      const item = items.find((i) => i.id === selectedItemId);
      if (item && item.categoryId !== selectedCategoryId) {
        setValue("itemId", "");
        setValue("name", "");
      }
    }
  }, [selectedCategoryId, selectedItemId, items, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Category & Item selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Category *</Label>
          <select
            {...register("categoryId")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Item *</Label>
          <select
            {...register("itemId")}
            disabled={!selectedCategoryId}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          >
            <option value="">{selectedCategoryId ? "Select an item" : "Select category first"}</option>
            {filteredItems.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
          {errors.itemId && <p className="text-xs text-red-500">{errors.itemId.message}</p>}
        </div>
      </div>

      {/* Hidden name field (auto-set from item) */}
      <input type="hidden" {...register("name")} />

      {/* Brand */}
      <div className="space-y-1.5">
        <Label>Brand</Label>
        <Input placeholder="e.g. India Gate, Fortune" {...register("brand")} />
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

      {/* Price options with mode */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Price Options *</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ weight: "", price: "" as unknown as number, stock: "" as unknown as number, mode: "RETAIL", minQty: 1 })}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Retail
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
              onClick={() => append({ weight: "25kg bag", price: "" as unknown as number, stock: "" as unknown as number, mode: "BULK", minQty: 5 })}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Bulk
            </Button>
          </div>
        </div>
        {errors.priceOptions && (
          <p className="text-xs text-red-500">{errors.priceOptions.message}</p>
        )}

        <div className="space-y-3">
          {fields.map((field, index) => {
            const mode = watch(`priceOptions.${index}.mode`);
            const isBulk = mode === "BULK";
            const suggestions = isBulk ? BULK_WEIGHT_SUGGESTIONS : RETAIL_WEIGHT_SUGGESTIONS;

            return (
              <div key={field.id} className={`p-3 rounded-xl border ${isBulk ? "border-blue-200 bg-blue-50/30" : "border-gray-200 bg-gray-50/30"}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isBulk ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                    {isBulk ? "BULK" : "RETAIL"}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2 items-start flex-wrap">
                  <div className="flex-1 min-w-[120px]">
                    <Input
                      placeholder="Weight"
                      {...register(`priceOptions.${index}.weight`)}
                      list={`weight-suggestions-${index}`}
                    />
                    <datalist id={`weight-suggestions-${index}`}>
                      {suggestions.map((s) => (
                        <option key={s} value={s} />
                      ))}
                    </datalist>
                    {errors.priceOptions?.[index]?.weight && (
                      <p className="text-xs text-red-500 mt-0.5">{errors.priceOptions[index].weight?.message}</p>
                    )}
                  </div>
                  <div className="w-28">
                    <Input type="number" placeholder="Price ₹" {...register(`priceOptions.${index}.price`)} />
                    {errors.priceOptions?.[index]?.price && (
                      <p className="text-xs text-red-500 mt-0.5">{errors.priceOptions[index].price?.message}</p>
                    )}
                  </div>
                  <div className="w-24">
                    <Input type="number" placeholder="Stock" {...register(`priceOptions.${index}.stock`)} />
                  </div>
                  {isBulk && (
                    <div className="w-24">
                      <Input type="number" placeholder="Min qty" {...register(`priceOptions.${index}.minQty`)} />
                      <p className="text-xs text-blue-500 mt-0.5">Min order</p>
                    </div>
                  )}
                </div>
                <input type="hidden" {...register(`priceOptions.${index}.mode`)} />
              </div>
            );
          })}
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
