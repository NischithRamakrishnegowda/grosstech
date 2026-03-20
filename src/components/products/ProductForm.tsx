"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Loader2, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import { toast } from "sonner";

const priceOptionSchema = z.object({
  weight: z.string().min(1, "Required"),
  price: z.coerce.number().positive("Must be > 0"),
  stock: z.coerce.number().int().min(0, "Must be ≥ 0"),
});

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  brand: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.string().optional().or(z.literal("")),
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
      priceOptions: [{ weight: "", price: "" as unknown as number, stock: "" as unknown as number }],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "priceOptions" });

  const [imagePreview, setImagePreview] = useState<string>(defaultValues?.imageUrl || "");
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentImageUrl = watch("imageUrl");

  async function compressImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 800;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX; }
          else { width = Math.round((width * MAX) / height); height = MAX; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Failed to load image")); };
      img.src = url;
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB");
      return;
    }

    // Instant local preview while compressing
    setImagePreview(URL.createObjectURL(file));
    setImageUploading(true);

    try {
      const base64 = await compressImage(file);
      setValue("imageUrl", base64, { shouldValidate: true });
      setImagePreview(base64);
      toast.success("Image ready");
    } catch {
      toast.error("Failed to process image");
      setImagePreview(currentImageUrl || "");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setImageUploading(false);
    }
  }

  function handleRemoveImage() {
    setValue("imageUrl", "", { shouldValidate: false });
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

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

      {/* Image upload */}
      <div className="space-y-2">
        <Label>Product Image</Label>

        {imagePreview ? (
          <div className="relative w-full aspect-video max-h-48 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            {imageUploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
              </div>
            )}
            {!imageUploading && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-2 text-gray-400 hover:border-green-300 hover:text-green-500 transition-colors bg-gray-50 hover:bg-green-50/30"
          >
            <ImagePlus className="w-8 h-8" />
            <p className="text-sm font-medium">Click to upload image</p>
            <p className="text-xs">JPG, PNG, WebP — max 5 MB</p>
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Hidden registered input so imageUrl stays in form data */}
        <input type="hidden" {...register("imageUrl")} />

        {!imagePreview && (
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs text-gray-400">or paste URL</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>
        )}
        {!imagePreview && (
          <Input
            placeholder="https://..."
            value={currentImageUrl || ""}
            onChange={(e) => {
              setValue("imageUrl", e.target.value, { shouldValidate: true });
              setImagePreview(e.target.value);
            }}
          />
        )}
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
            onClick={() => append({ weight: "", price: "" as unknown as number, stock: "" as unknown as number })}
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

      <Button type="submit" disabled={loading || imageUploading} className="w-full bg-green-600 hover:bg-green-700">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        {imageUploading ? "Uploading image..." : submitLabel}
      </Button>
    </form>
  );
}
