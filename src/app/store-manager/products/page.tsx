'use client';

import { Product, Vendor } from "@/app/types/types";
import { useRef, Suspense } from "react";
import NoVendorRedirect from "@/components/storeManagerHelpers/NoVendorRedirect";
import StoreManagerProductsTable from "@/components/storeManagerHelpers/StoreManagerProductsTable";
import StoreManagerTemplate from "@/components/storeManagerHelpers/StoreManagerTemplate";
import StoreManagerProductsHeader from "@/components/StoreManagerProductsHeader";
import { useUser } from "@/contexts/UserContext";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import type { TourStep } from "@/components/storeManagerHelpers/ProductQuickStartGuide";

const ProductQuickStartGuide = dynamic(() => import("@/components/storeManagerHelpers/ProductQuickStartGuide"), { ssr: false });

const productTourSteps: TourStep[] = [
    {
        selector: '[data-tour="add-product-btn"]',
        title: "Add New Product",
        description: "Click here to start creating a new product. The modal will open automatically for you."
    },
    {
        selector: '[data-tour="product-name-input"]',
        title: "Name Your Product",
        description: "Enter a clear, descriptive name for your product. Include important details like size, color, or pattern."
    },
    {
        selector: '[data-tour="product-description"]',
        title: "Describe Your Product", 
        description: "Write a brief but informative description. This appears in product cards and search results."
    },
    {
        selector: '[data-tour="product-tags"]',
        title: "Add Product Tags",
        description: "Add relevant keywords that customers might search for. Examples: 'dry-fly', 'trout', 'mayfly', 'adams', 'size-14'. Press Enter after each tag."
    },
    {
        selector: '[data-tour="product-categories"]',
        title: "Select Categories",
        description: "Choose the main category your product belongs to. Examples: 'dry-flies', 'nymphs', 'streamers', 'saltwater'. This helps organize your products."
    },
    {
        selector: '[data-tour="product-images"]',
        title: "Add Product Images",
        description: "Upload high-quality images of your product. The first image will be your main product photo. Good photos significantly increase sales!"
    },
    {
        selector: '[data-tour="inventory-tab"]',
        title: "Switch to Inventory & Pricing",
        description: "Now let's set up your pricing and inventory. Click on the 'Inventory & Pricing' tab to continue."
    },
    {
        selector: '[data-tour="product-price"]',
        title: "Set Your Price",
        description: "Enter the price for your product. Consider your costs, competition, and desired profit margin."
    },
    {
        selector: '[data-tour="stock-status"]',
        title: "Stock Status",
        description: "Let customers know if your product is in stock, out of stock, or unknown. This helps manage customer expectations."
    },
    {
        selector: '[data-tour="quantity-options"]',
        title: "Quantity Options",
        description: "Set the quantities customers can purchase. For example, if you sell flies in packs, add options like 6, 12, 18, 24."
    },
    {
        selector: '[data-tour="shipping-info"]',
        title: "Shipping Information",
        description: "Enter accurate package dimensions and weight. This is crucial for calculating proper shipping costs for your customers."
    },
    {
        selector: '[data-tour="save-draft"]',
        title: "Save Your Product",
        description: "Great! Now save your product as a draft to finish setting it up later, or publish it directly to your store."
    }
];

function ProductsContent() {
    const { user } = useUser();
    const [vendor, setVendor] = useState<Vendor | undefined>(undefined);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [tourStep, setTourStep] = useState(0);
    const [draftProductId, setDraftProductId] = useState<string | null>(null);

    const fetchVendorAndProducts = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            // Fetch vendor
            const vendorResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor?userId=${user.uid}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (vendorResponse.ok) {
                const vendorData = await vendorResponse.json();
                console.log('Vendor data received:', vendorData);
                setVendor(vendorData.vendor);
            } else {
                const errorData = await vendorResponse.json();
                console.error('Failed to fetch vendor:', vendorResponse.status, errorData);
                setVendor(undefined);
            }

            // Fetch products
            const productsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/product?vendorId=${user.uid}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (productsResponse.ok) {
                const productsData = await productsResponse.json();
                console.log('Products data received:', productsData);
                setProducts(productsData.data || []);
            } else {
                const errorData = await productsResponse.json();
                console.error('Failed to fetch products:', productsResponse.status, errorData);
                setProducts([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setVendor(undefined);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [user?.uid]);

    const router = useRouter();
    const searchParams = useSearchParams();
    const showTour = searchParams.get('tour') === '1';
    const [domReady, setDomReady] = useState(false);
    useEffect(() => {
        setDomReady(true);
    }, []);

    useEffect(() => {
        fetchVendorAndProducts();
    }, [fetchVendorAndProducts]);

    // Prefetch next tour page if tour is active
    useEffect(() => {
        if (showTour) {
            router.prefetch && router.prefetch('/store-manager/orders?tour=1');
        }
    }, [showTour, router]);

    // Tour step logic
    useEffect(() => {
        if (!showTour) return;

        // Keep modal open for all tour steps except the first one
        if (tourStep >= 1) {
            setModalOpen(true);
        } else {
            setModalOpen(false);
        }
    }, [showTour, tourStep]);

    // Open modal when tour starts
    useEffect(() => {
        if (showTour) {
            setModalOpen(true);
        }
    }, [showTour]);

    // Handle draft creation
    const handleDraftCreated = (draftId: string) => {
        setDraftProductId(draftId);
        // Move to next step after draft is created
        setTourStep(prev => prev + 1);
    };

    // Add handleProductAdded function
    const handleProductAdded = () => {
        if (showTour) {
            fetchVendorAndProducts();
            // Move to next step after product is added
            setTourStep(prev => prev + 1);
        } else {
            fetchVendorAndProducts();
        }
    };

    // Handle finishing the tour
    const handleTourFinish = () => {
        setModalOpen(false);
        router.push('/store-manager/orders?tour=1');
    };

    // Update the tour step change handler to handle tab switching:
    const handleTourStepChange = (newStep: number) => {
        console.log('Tour step changing from', tourStep, 'to', newStep);
        setTourStep(newStep);
        
        // Automatically open modal when moving from step 0 to 1
        if (newStep >= 1) {
            setModalOpen(true);
        }
        
        // Switch to inventory tab when reaching step 6 (inventory-tab step)
        if (newStep === 6) {
            // We need to communicate with the modal to switch tabs
            // This will be handled by the modal component itself when it detects this tour step
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-greenPrimary"></div>
                    <p className="text-gray-600">Loading products...</p>
                </div>
            </div>
        );
    }

    if (!vendor || !vendor.id) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Vendor not found</h1>
                    <p className="text-gray-600">Unable to load vendor information. Please try again later.</p>
                </div>
            </div>
        );
    }

    return (
        <NoVendorRedirect vendor={vendor}>
            <StoreManagerTemplate>
                <StoreManagerProductsHeader 
                    vendorId={vendor?.id || ''} 
                    onProductAdded={showTour ? handleProductAdded : fetchVendorAndProducts} 
                    modalOpen={modalOpen}
                    setModalOpen={setModalOpen}
                    tourStep={showTour ? tourStep : undefined}
                    onDraftCreated={handleDraftCreated}
                />
                <StoreManagerProductsTable 
                    products={products}
                    onProductUpdated={fetchVendorAndProducts}
                    vendorId={vendor?.id || ''}
                    draftProductId={draftProductId || undefined}
                    tourStep={showTour ? tourStep : undefined}
                />
                {showTour && (
                    <ProductQuickStartGuide
                        steps={productTourSteps}
                        currentStep={tourStep}
                        onStepChange={handleTourStepChange}
                        onClose={handleTourFinish}
                    />
                )}
            </StoreManagerTemplate>
        </NoVendorRedirect>
    );
}

export default function Page() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-greenPrimary"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        }>
            <ProductsContent />
        </Suspense>
    );
}