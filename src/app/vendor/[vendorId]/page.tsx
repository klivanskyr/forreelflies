import { VendorProfile, ProductWithVendor } from "@/app/types/types";
import ProductGallery from "@/components/ProductInfo/ProductGallery";
import { FaStore, FaMapMarkerAlt, FaEnvelope } from "react-icons/fa";
import Link from "next/link";
import VendorReviews from "@/components/VendorReviews";
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
  
  if (!vendor) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Vendor not found</h1>
        <Link href="/shop" className="text-green-600 hover:text-green-800 underline">
          Return to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Section */}
      {vendor.bannerImageUrl && (
        <div className="w-full h-64 md:h-80 relative overflow-hidden">
          <img src={vendor.bannerImageUrl} alt="Store Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 pb-12">
        {/* Vendor Header */}
        <div className={`relative mb-8 ${vendor.bannerImageUrl ? '-mt-20' : 'pt-8'}`}>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {vendor.profileImageUrl && (
                <img 
                  src={vendor.profileImageUrl} 
                  alt="Store Profile" 
                  className="h-32 w-32 rounded-full object-cover border-4 border-white shadow-lg" 
                />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <FaStore className="w-6 h-6 text-green-600" />
                  <h1 className="text-4xl font-bold text-gray-900">{vendor.storeName}</h1>
                </div>
                
                {vendor.bio && (
                  <p className="text-gray-700 text-lg leading-relaxed mb-4">{vendor.bio}</p>
                )}
                
                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="w-4 h-4" />
                    <span>Location info</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="w-4 h-4" />
                    <span>Contact available</span>
                  </div>
                </div>
                
                {vendor.socialLinks && vendor.socialLinks.length > 0 && (
                  <div className="flex gap-3 mt-4">
                    {vendor.socialLinks.map((link, i) => (
                      <a 
                        key={i} 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors"
                      >
                        {link.type}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Products Section */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Products ({products.length})</h2>
              {products.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {products.map((product) => (
                    <Link key={product.id} href={`/product/${product.id}`} className="group">
                      <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <div className="aspect-square bg-gray-100">
                          <ProductGallery images={product.images} />
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors mb-2">
                            {product.name}
                          </h3>
                          <p className="text-2xl font-bold text-green-600">${product.price.toFixed(2)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No products available yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link 
                  href={`/shop?vendorId=${params.vendorId}`}
                  className="block w-full py-2 px-4 bg-green-600 text-white text-center rounded-md hover:bg-green-700 transition-colors"
                >
                  View All Products
                </Link>
                <button className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                  Contact Vendor
                </button>
                <button className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">
                  Follow Store
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <VendorReviews vendorId={params.vendorId} vendorName={vendor.storeName} />
        </div>
      </div>
    </div>
  );
} 