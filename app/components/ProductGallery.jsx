"use client";

import Image from "next/image";
import { useState, useEffect, useMemo } from "react";

export default function ProductGallery({ images = [], colorImagesMap = {}, selectedColor = "" }) {
  // Find images specific to the selected color
  const colorMatchedImages = useMemo(() => {
    if (!selectedColor || !colorImagesMap || Object.keys(colorImagesMap).length === 0) {
      return [];
    }
    const cleanColor = selectedColor.trim().toLowerCase();
    for (const [key, imgs] of Object.entries(colorImagesMap)) {
      if (key && key.trim().toLowerCase() === cleanColor && Array.isArray(imgs) && imgs.length > 0) {
        return imgs;
      }
    }
    return [];
  }, [selectedColor, colorImagesMap]);

  // Unified list of images: color-specific images first, then other images
  const displayImages = useMemo(() => {
    if (colorMatchedImages.length > 0) {
      const rest = (images || []).filter((img) => !colorMatchedImages.includes(img));
      return [...colorMatchedImages, ...rest];
    }
    return images && images.length > 0
      ? images
      : ["https://placehold.co/800x800?text=No+Image+Available"];
  }, [colorMatchedImages, images]);

  // The page always shows exactly TWO images:
  //   1. The first image — permanent, never changes.
  //   2. The second image — driven by whichever thumbnail is selected
  //      (no matter how many thumbnails exist).
  const [secondIndex, setSecondIndex] = useState(displayImages.length > 1 ? 1 : 0);

  // When the colour (and therefore the image set) changes, reset the swappable slot.
  useEffect(() => {
    setSecondIndex(displayImages.length > 1 ? 1 : 0);
  }, [selectedColor, displayImages.length]);

  // Keep the index valid if the list shrinks.
  useEffect(() => {
    if (secondIndex >= displayImages.length) {
      setSecondIndex(displayImages.length > 1 ? 1 : 0);
    }
  }, [displayImages, secondIndex]);

  if (!displayImages || displayImages.length === 0) return null;

  const firstImage = displayImages[0];
  const safeSecond = secondIndex < displayImages.length ? secondIndex : 0;
  const secondImage = displayImages[safeSecond];
  const hasSecond = displayImages.length > 1;

  return (
    <div className="w-full flex flex-col gap-4">

      {/* 1. Permanent main image — always the first image (395 x 600) */}
      <div className="relative aspect-[395/600] w-full rounded-md border border-[#E8E0D5] bg-[#FAF8F5] overflow-hidden group">
        <Image
          src={firstImage}
          alt="Product main view"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 400px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          priority
        />
      </div>

      {/* 2. Second image — swaps with the selected thumbnail (395 x 398) */}
      {hasSecond && (
        <div className="relative aspect-[395/398] w-full rounded-md border border-[#E8E0D5] bg-[#FAF8F5] overflow-hidden group">
          <Image
            key={secondImage}
            src={secondImage}
            alt="Product detail view"
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 40vw, 400px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>
      )}

      {/* Thumbnails row — selects which image fills the second slot */}
      {hasSecond && (
        <div className="flex flex-row items-center gap-3 overflow-x-auto overflow-y-hidden py-1">
          {displayImages.map((img, index) => {
            const isSelected = safeSecond === index;
            return (
              <button
                key={`${img}-thumb-${index}`}
                type="button"
                onClick={() => setSecondIndex(index)}
                aria-label={`View image ${index + 1}`}
                className={`relative h-[68px] w-[68px] sm:h-[76px] sm:w-[76px] flex-shrink-0 rounded-md border-2 overflow-hidden bg-[#FAF8F5] transition-colors duration-200 cursor-pointer ${isSelected
                  ? "border-[#135B42]"
                  : "border-[#E5DDD2] hover:border-[#135B42]/60 opacity-80 hover:opacity-100"
                  }`}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  sizes="76px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
