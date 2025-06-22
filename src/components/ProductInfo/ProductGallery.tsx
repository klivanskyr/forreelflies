import React, { useState } from "react";
import { ProductGalleryProps } from "@/app/types/types";

const ProductGallery: React.FC<ProductGalleryProps> = ({ images }) => {
  const [selected, setSelected] = useState(0);
  if (!images || images.length === 0) return null;
  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex justify-center mb-2">
        <img
          src={images[selected]}
          alt={`Product image ${selected + 1}`}
          className="max-h-80 rounded shadow-lg object-contain"
        />
      </div>
      <div className="flex gap-2 mt-2">
        {images.map((img, i) => (
          <img
            key={i}
            src={img}
            alt={`Thumbnail ${i + 1}`}
            className={`h-16 w-16 object-cover rounded cursor-pointer border-2 ${selected === i ? "border-green-600" : "border-gray-300"}`}
            onClick={() => setSelected(i)}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductGallery; 