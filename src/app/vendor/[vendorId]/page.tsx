import { VendorProfile, ProductWithVendor } from "@/app/types/types";
import ProductGallery from "@/components/ProductInfo/ProductGallery";
import React from "react";

async function fetchVendor(vendorId: string): Promise<VendorProfile | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor?vendorId=${vendorId}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.vendor as VendorProfile;
}

async function fetchProducts(vendorId: string): Promise<ProductWithVendor[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product?vendorId=${vendorId}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data as ProductWithVendor[];
}

export default async function VendorPage({ params }: { params: { vendorId: string } }) {
  const vendor = await fetchVendor(params.vendorId);
  const products = await fetchProducts(params.vendorId);
  if (!vendor) return <div>Vendor not found</div>;
  return (
    <div className="max-w-5xl mx-auto p-4">
      {vendor.bannerImageUrl && (
        <img src={vendor.bannerImageUrl} alt="Banner" className="w-full h-48 object-cover rounded mb-4" />
      )}
      <div className="flex items-center gap-4 mb-4">
        {vendor.profileImageUrl && (
          <img src={vendor.profileImageUrl} alt="Profile" className="h-24 w-24 rounded-full object-cover border-4 border-white shadow" />
        )}
        <div>
          <h1 className="text-3xl font-bold">{vendor.storeName}</h1>
          {vendor.bio && <p className="text-gray-600 mt-2">{vendor.bio}</p>}
          {vendor.socialLinks && vendor.socialLinks.length > 0 && (
            <div className="flex gap-2 mt-2">
              {vendor.socialLinks.map((link, i) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  {link.type}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      <h2 className="text-2xl font-semibold mt-8 mb-4">Products</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg p-4 bg-white shadow">
            <ProductGallery images={product.images} />
            <h3 className="text-xl font-bold mt-2">{product.name}</h3>
            <p className="text-green-700 font-semibold">${product.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
} 