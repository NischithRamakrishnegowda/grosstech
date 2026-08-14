"use client";

import { useState, useRef, useCallback } from "react";
import NextImage from "next/image";
import { ImagePlus, X, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

// Compress and resize image client-side before uploading
function compressImage(file: File, maxDim = 800): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Compression failed"))),
        "image/jpeg",
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load image"));
    };
    img.src = objectUrl;
  });
}

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  className?: string;
  aspectRatio?: "square" | "3/2" | "4/3";
}

export function ImageUpload({ value, onChange, className = "", aspectRatio = "square" }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const aspectClass = {
    square: "aspect-square",
    "3/2": "aspect-[3/2]",
    "4/3": "aspect-[4/3]",
  }[aspectRatio];

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a JPG, PNG, or WebP image");
        return;
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error("Image must be under 20 MB");
        return;
      }

      setUploading(true);
      try {
        const compressed = await compressImage(file);
        const formData = new FormData();
        formData.append("file", compressed, `image.jpg`);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Upload failed");
        onChange(data.url);
        toast.success("Image uploaded");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // Existing uploaded image (CDN URL)
  const isUrl = value && !value.startsWith("data:");

  return (
    <div className={className}>
      <div className={`relative ${aspectClass} rounded-xl overflow-hidden`}>
        {isUrl ? (
          // CDN-hosted image
          <>
            <NextImage src={value} alt="Uploaded image" fill className="object-cover" sizes="300px" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute top-2 right-2 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-10"
              aria-label="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          // Upload zone (or legacy base64 preview)
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileRef.current?.click()}
            className={`w-full h-full flex flex-col items-center justify-center gap-2 border-2 border-dashed cursor-pointer transition-all ${
              dragging
                ? "border-green-400 bg-green-50"
                : "border-gray-200 hover:border-green-300 hover:bg-gray-50/80 bg-gray-50"
            } ${uploading ? "pointer-events-none" : ""}`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-7 h-7 text-green-500 animate-spin" />
                <p className="text-xs text-gray-400 font-medium">Uploading…</p>
              </>
            ) : value ? (
              // Legacy base64 — show it but allow replacing
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={value} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Upload className="w-6 h-6 text-white mb-1" />
                  <p className="text-xs text-white font-medium">Replace image</p>
                </div>
              </>
            ) : (
              <>
                <ImagePlus className="w-6 h-6 text-gray-300" />
                <div className="text-center px-2">
                  <p className="text-[10px] font-medium text-gray-400 leading-tight">Click to upload</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">JPG, PNG, WebP</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
      />
    </div>
  );
}
