'use client';

import React, { useState } from "react";
import Image from "next/image";
import { ProductGalleryProps } from "@/app/types/types";

const ProductGallery: React.FC<ProductGalleryProps> = ({ images }) => {
  const [selected, setSelected] = useState(0);
  if (!images || images.length === 0) return null;
  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex justify-center mb-2 relative h-80">
        <Image
          src={images[selected]}
          alt={`Product image ${selected + 1}`}
          fill
          className="rounded shadow-lg object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="flex gap-2 mt-2">
        {images.map((img, i) => (
          <div key={i} className="relative h-16 w-16">
            <Image
              src={img}
              alt={`Thumbnail ${i + 1}`}
              fill
              className={`object-cover rounded cursor-pointer border-2 ${selected === i ? "border-green-600" : "border-gray-300"}`}
              onClick={() => setSelected(i)}
              sizes="(max-width: 768px) 25vw, 16px"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductGallery; 