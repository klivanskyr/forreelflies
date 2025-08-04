'use client';

import { Product } from "@/app/types/types";
import Table from "../Table/Table";
import Button from "../buttons/Button";
import { useState } from "react";
import StoreManagerUpdateProductModal from "./StoreManagerUpdateProductModal";
import Image from 'next/image';


interface Props {
    products: Product[];
    onProductUpdated: () => void;
    vendorId: string;
    draftProductId?: string;
    tourStep?: number;
}

export default function StoreManagerProductsTable({ products, onProductUpdated, vendorId, draftProductId, tourStep }: Props) {
    const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

    function ActionButtons({ product }: { product: Product }) {
        const handleDelete = async () => {
            if (!confirm(`Are you sure you want to delete &quot;${product.name}&quot;? This action cannot be undone.`)) {
                return;
            }

            setDeleteLoading(product.id);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product?productId=${product.id}&vendorId=${vendorId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    onProductUpdated(); // Refresh the list
                } else {
                    const errorData = await response.json();
                    alert(`Error deleting product: ${errorData.error || "Unknown error"}`);
                }
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('An unexpected error occurred while deleting the product');
            } finally {
                setDeleteLoading(null);
            }
        };

        return (
            <div className="w-full flex flex-row justify-center gap-2">
                <Button 
                    className="w-1/3 text-sm" 
                    text="Edit" 
                    onClick={() => {
                        setSelectedProduct(product);
                        setEditModalOpen(true);
                    }} 
                />
                <Button 
                    className="w-1/3 text-sm bg-red-600 hover:bg-red-700" 
                    text={deleteLoading === product.id ? "..." : "Delete"} 
                    onClick={handleDelete}
                    disabled={deleteLoading === product.id}
                />
            </div>
        );
    }

    const options = [
        { value: "inStock", label: "In Stock" },
        { value: "outOfStock", label: "Out of Stock" },
        { value: "unknown", label: "Unknown" }
    ];

    const convertStockStatus = (stockStatus: string | undefined) => {
        return options.find(option => option.value === stockStatus)?.label || "Unknown";
    };

    // Custom empty state for products
    if (products.length === 0) {
        return (
            <div className="w-full">
                {/* Show headers */}
                <div className="bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-5 gap-4 p-4">
                        <div className="font-medium text-gray-900">Name</div>
                        <div className="font-medium text-gray-900">Price</div>
                        <div className="font-medium text-gray-900">Stock</div>
                        <div className="font-medium text-gray-900">Status</div>
                        <div className="font-medium text-gray-900 text-center">Actions</div>
                    </div>
                </div>
                
                {/* Empty state message */}
                <div className="text-center py-16 bg-white border-b border-gray-200">
                    <div className="flex flex-col items-center">
                        <svg className="w-16 h-16 text-gray-400 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No products yet</h3>
                        <p className="text-gray-500 mb-6 max-w-md">
                            You haven&apos;t added any products to your store yet. Start by adding your first product to begin selling.
                        </p>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-400">Click the &quot;Add Product&quot; button above to get started</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <Table
                columns={[
                    {
                        label: <h2>Name</h2>,
                        key: (item: Product) => (
                            <div
                                className={`flex flex-row w-full h-full items-center ${draftProductId && item.id === draftProductId && tourStep === 2 ? 'ring-4 ring-green-400 relative z-[1001]' : ''}`}
                                data-tour={draftProductId && item.id === draftProductId && tourStep === 2 ? 'product-table-row' : undefined}
                            >
                                <div className="flex items-center space-x-3">
                                    {item.images && item.images.length > 0 && (
                                        <div className="relative w-12 h-12">
                                            <Image
                                                src={item.images[0]}
                                                alt={item.name}
                                                fill
                                                className="object-cover rounded"
                                                sizes="48px"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        {item.shortDescription && (
                                            <p className="text-sm text-gray-500 truncate max-w-xs">
                                                {item.shortDescription}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    },
                    { 
                        label: <h2>Price</h2>, 
                        key: (item: Product) => {
                            const hasDiscount = item.originalPrice && item.originalPrice > item.price;
                            const discountPercentage = hasDiscount && item.originalPrice ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0;
                            
                            return (
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-gray-900">${item.price?.toFixed(2) || "0.00"}</p>
                                        {hasDiscount && item.originalPrice && (
                                            <span className="text-sm text-gray-500 line-through">${item.originalPrice.toFixed(2)}</span>
                                        )}
                                    </div>
                                    {hasDiscount && (
                                        <div className="flex items-center gap-1">
                                            <span className="bg-red-100 text-red-800 text-xs font-medium px-1.5 py-0.5 rounded">
                                                {discountPercentage}% OFF
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        }
                    },
                    { 
                        label: <h2>Stock</h2>, 
                        key: (item: Product) => (
                            <div className="flex flex-row w-full h-full items-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    item.stockStatus === 'inStock' ? 'bg-green-100 text-green-800' :
                                    item.stockStatus === 'outOfStock' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                }`}>
                                    {convertStockStatus(item.stockStatus)}
                                </span>
                            </div>
                        )
                    },
                    { 
                        label: <h2>Status</h2>, 
                        key: (item: Product) => (
                            <div className="flex flex-row w-full h-full items-center">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    item.isDraft ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                }`}>
                                    {item.isDraft ? "Draft" : "Published"}
                                </span>
                            </div>
                        )
                    },
                    { 
                        label: <h2 className="text-center">Actions</h2>, 
                        key: (item: Product) => <ActionButtons product={item} />
                    },
                ]}
                items={products}
                itemsPerPage={10}
            />

            <StoreManagerUpdateProductModal
                product={selectedProduct}
                modalOpen={editModalOpen}
                setModalOpen={setEditModalOpen}
                onProductUpdated={() => {
                    onProductUpdated();
                    setSelectedProduct(null);
                }}
                vendorId={vendorId}
            />
        </>
    );
}