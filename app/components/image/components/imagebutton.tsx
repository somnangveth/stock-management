"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ChangeEvent, useRef } from "react";
import { FaPlus } from "react-icons/fa";

interface UploadImageButtonProps {
  imageUrls: string[];
  setImageUrls: (urls: string[]) => void;
}

export default function UploadImageButton({
  imageUrls,
  setImageUrls,
}: UploadImageButtonProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const previewUrl = URL.createObjectURL(file);

    // Replace mode (single image)
    setImageUrls([previewUrl]);
  };

  const hasImage = imageUrls.length > 0;

  return (
    <div className="flex items-center">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleImageChange}
      />

      <Button
        type="button"
        onClick={() => imageInputRef.current?.click()}
        className="relative w-32 h-32 p-0 rounded-lg border border-gray-400 bg-gray-200 overflow-hidden group"
      >
        {/* Image */}
        {hasImage && (
          <Image
            src={imageUrls[0]}
            alt="Uploaded image"
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-105"
          />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Plus Icon */}
        <FaPlus
          className={`absolute text-white text-4xl transition-opacity ${
            hasImage ? "opacity-0 group-hover:opacity-100" : "opacity-100"
          }`}
        />
      </Button>
    </div>
  );
}
