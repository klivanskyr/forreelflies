'use client';

export const dynamic = "force-dynamic";

import Link from "next/link";
import { Product, Rate } from "../types/types";
import NoXRedirect from "@/components/NoXRedirect";
import Breadcrumbs from "@/components/Breadcrumbs";
import { VendorItem } from "../api/v1/checkout/route";
import CheckoutButton from "@/components/CheckoutButton";
import ShippingAddressModal from "@/components/modal/ShippingAddressModal";
import { useSession, signOut, getSession } from "next-auth/react";
import { useEffect, useState } from "react";

export type CartId = {
    id: string,
    quantity: number,
}

export type CartItem = {
    product: Product,
    quantity: number,
};

export default function Page() {
    const { data: session, status, update } = useSession();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rates, setRates] = useState<Rate[]>([]);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [shippingCalculationStatus, setShippingCalculationStatus] = useState<'idle' | 'calculating' | 'success' | 'failed'>('idle');
    const [shippingError, setShippingError] = useState<string | null>(null);
    const [clearingCart, setClearingCart] = useState(false);

    useEffect(() => {
        if (status === 'loading') return; // Still loading session
        if (!session?.user) {
            setLoading(false);
            return;
        }

        const fetchCartData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch cart items
                const response = await fetch(`/api/v1/user/cart?id=${session.user.uid}`);
                
                if (response.status === 401) {
                    console.log("Session expired, signing out...");
                    await signOut({ redirect: false });
                    return;
                }

                if (!response.ok) {
                    throw new Error(`Failed to fetch cart: ${response.status}`);
                }

                const data = await response.json();
                const cartIds: CartId[] = data.data || [];

                if (cartIds.length === 0) {
                    setCartItems([]);
                    setLoading(false);
                    return;
                }

                // Fetch product details for each cart item
                const promises: Promise<CartItem>[] = cartIds.map(async (cartId) => {
                    const productResponse = await fetch(`/api/v1/product?id=${cartId.id}`);
                    const productData = await productResponse.json();
                    return { product: productData as Product, quantity: cartId.quantity };
                });

                const items = await Promise.all(promises);
                setCartItems(items);

                // Calculate shipping if user has address
                console.log("Checking user address on cart load:", {
                    hasStreetAddress: !!session.user.streetAddress,
                    hasCity: !!session.user.city,
                    hasState: !!session.user.state,
                    hasZip: !!session.user.zipCode,
                    hasCountry: !!session.user.country,
                    address: {
                        street: session.user.streetAddress,
                        city: session.user.city,
                        state: session.user.state,
                        zip: session.user.zipCode,
                        country: session.user.country
                    }
                });

                if (session.user.streetAddress && session.user.city && session.user.state && session.user.zipCode && session.user.country) {
                    console.log("User has complete address, calculating shipping...");
                    console.log("Cart items for shipping calculation:", items.map(item => ({
                        id: item.product.id,
                        name: item.product.name,
                        vendorId: item.product.vendorId,
                        vendorName: item.product.vendorName,
                        hasShippingDimensions: !!(item.product.shippingWeight && item.product.shippingLength && item.product.shippingWidth && item.product.shippingHeight)
                    })));
                    
                    setShippingCalculationStatus('calculating');
                    setShippingError(null);
                    
                    try {
                        const { calculateShipping } = await import("@/helpers/calculateShipping");
                        const userForShipping = {
                            ...session.user,
                            vendorSignUpStatus: session.user.vendorSignUpStatus as any
                        };
                        
                        console.log("Starting shipping calculation for user:", {
                            username: userForShipping.username,
                            address: `${userForShipping.streetAddress}, ${userForShipping.city}, ${userForShipping.state} ${userForShipping.zipCode}`
                        });
                        
                        const [calculatedRates, err] = await calculateShipping(userForShipping, items.map(item => item.product));
                        
                        console.log("Shipping calculation result:", {
                            success: !err,
                            error: err,
                            ratesCount: calculatedRates.length,
                            rates: calculatedRates.map(rate => ({
                                vendorId: rate.sellerId,
                                vendorName: rate.sellerName,
                                amount: rate.amount,
                                provider: rate.provider
                            }))
                        });
                        
                        if (!err && calculatedRates.length > 0) {
                            setRates(calculatedRates);
                            setShippingCalculationStatus('success');
                            console.log("Initial shipping rates calculated successfully");
                        } else {
                            console.error("Failed to calculate initial shipping rates:", err);
                            setShippingCalculationStatus('failed');
                            setShippingError(err || "Failed to calculate shipping rates");
                        }
                    } catch (shippingError) {
                        console.error('Error calculating shipping:', shippingError);
                        setShippingCalculationStatus('failed');
                        setShippingError(shippingError instanceof Error ? shippingError.message : "Shipping calculation failed");
                    }
                } else {
                    console.log("User address incomplete, skipping shipping calculation");
                    setShippingCalculationStatus('idle');
                }

            } catch (error) {
                console.error('Error fetching cart data:', error);
                setError(error instanceof Error ? error.message : 'Failed to load cart');
            } finally {
                setLoading(false);
            }
        };

        fetchCartData();
    }, [session, status]);

    const handleAddressAdded = async () => {
        console.log("Address added, updating session...");
        
        // Update the session to get fresh user data with the new address
        await update();
        
        // Force a small delay and then trigger a re-render by updating a state
        setTimeout(async () => {
            // Get fresh session to verify the update
            const freshSession = await getSession();
            console.log("Fresh session after address update:", {
                hasAddress: !!(freshSession?.user?.streetAddress),
                address: {
                    street: freshSession?.user?.streetAddress,
                    city: freshSession?.user?.city,
                    state: freshSession?.user?.state,
                    zip: freshSession?.user?.zipCode,
                    country: freshSession?.user?.country
                }
            });
            
            // Force component to re-evaluate by updating loading state briefly
            setLoading(true);
            setTimeout(() => {
                setLoading(false);
                console.log("UI should now reflect updated address");
            }, 100);
        }, 500);
        
        // Calculate shipping rates with the new address
        setTimeout(async () => {
            // Refetch cart data to get updated shipping rates
            if (session?.user && cartItems.length > 0) {
                try {
                    const { calculateShipping } = await import("@/helpers/calculateShipping");
                    
                    // Get fresh session data
                    const freshSession = await getSession();
                    if (!freshSession?.user?.uid) {
                        console.log("No fresh session available");
                        return;
                    }
                    
                    const userForShipping = {
                        ...freshSession.user,
                        vendorSignUpStatus: freshSession.user.vendorSignUpStatus as any
                    };
                    
                    console.log("Calculating shipping with updated address:", {
                        hasAddress: !!(userForShipping.streetAddress && userForShipping.city && userForShipping.state),
                        address: {
                            street: userForShipping.streetAddress,
                            city: userForShipping.city,
                            state: userForShipping.state,
                            zip: userForShipping.zipCode
                        }
                    });
                    
                    setShippingCalculationStatus('calculating');
                    setShippingError(null);
                    
                    const [calculatedRates, err] = await calculateShipping(userForShipping, cartItems.map(item => item.product));
                    if (!err && calculatedRates.length > 0) {
                        setRates(calculatedRates);
                        setShippingCalculationStatus('success');
                        console.log("Updated shipping rates:", calculatedRates);
                    } else {
                        console.log("No shipping rates calculated:", err);
                        setShippingCalculationStatus('failed');
                        setShippingError(err || "Failed to calculate shipping rates");
                    }
                } catch (shippingError) {
                    console.error('Error calculating shipping:', shippingError);
                    setShippingCalculationStatus('failed');
                    setShippingError(shippingError instanceof Error ? shippingError.message : "Shipping calculation failed");
                }
            }
        }, 1000); // 1 second delay to ensure session update
    };

    const handleClearCart = async () => {
        if (!session?.user?.uid) return;
        
        setClearingCart(true);
        try {
            const response = await fetch(`/api/v1/user/cart?userId=${session.user.uid}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (response.ok) {
                setCartItems([]);
                setRates([]);
                setShippingCalculationStatus('idle');
                console.log('Cart cleared successfully');
            } else {
                console.error('Failed to clear cart:', response.status);
            }
        } catch (error) {
            console.error('Error clearing cart:', error);
        } finally {
            setClearingCart(false);
        }
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        );
    }

    if (!session?.user) {
        return (
            <NoXRedirect x={null} redirectUrl="/?login=true">
                <></>
            </NoXRedirect>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to load cart</h1>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <Link href="/shop" className="text-green-600 hover:text-green-800 underline">
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    if (cartItems.length === 0 && !loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
                    <p className="text-gray-600 mb-4">Add some products to get started!</p>
                    <Link href="/shop" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                        Start Shopping
                    </Link>
                </div>
            </div>
        );
    }

    const stockOptions = [
        { value: "inStock", label: "In Stock" },
        { value: "lowStock", label: "Low Stock" },
        { value: "outOfStock", label: "Out of Stock" },
    ];

    // Calculate totals
    const subtotal = loading ? 0 : cartItems
        .map(item => item.product.price * item.quantity)
        .reduce((acc, val) => acc + val, 0);

    const shippingCost = rates.reduce((acc, rate) => acc + rate.amount, 0);
    const tax = 0;
    const total = subtotal + shippingCost + tax;

    // Prepare vendor items for checkout by grouping cart items by vendor
    const vendorItemsMap = new Map<string, VendorItem>();
    
    if (!loading) {
        cartItems.forEach(cartItem => {
            const vendorId = cartItem.product.vendorId;
            
            if (!vendorItemsMap.has(vendorId)) {
                // Find shipping rate for this vendor
                const vendorRate = rates.find(rate => rate.sellerId === vendorId);
                const shippingFee = vendorRate ? vendorRate.amount : 0;
                
                vendorItemsMap.set(vendorId, {
                    vendorId: vendorId,
                    stripeAccountId: '', // TODO: Need to fetch vendor's Stripe account ID
                    cartItems: [],
                    shippingFee: shippingFee
                });
            }
            
            const vendorItem = vendorItemsMap.get(vendorId)!;
            vendorItem.cartItems.push(cartItem);
        });
    }
    
    const vendorItems: VendorItem[] = Array.from(vendorItemsMap.values());

    return (
        <NoXRedirect x={session.user} redirectUrl="/?login=true">
            <div className="flex flex-col w-full mx-auto max-w-7xl my-8 px-4 items-center justify-center">

                {/* Breadcrumb / Steps Row */}
                <Breadcrumbs 
                    breadcrumbs={[
                        { name: "Shopping Cart", href: "/cart" },
                        { name: "Checkout", href: "/checkout" },
                        { name: "Order Status", href: "/" },
                    ]}
                    activeIndex={0}
                />

                {/* Main Row: Left (cart items) & Right (summary) */}
                <div className="flex flex-col md:flex-row gap-8 w-full">
                    
                    {/* Left side: Cart items */}
                    <div className="flex-1">
                        {/* Table headers */}
                        <div className="hidden md:flex font-semibold text-gray-800 border-b border-gray-300 pb-2">
                            <div className="w-1/2">Product</div>
                            <div className="w-1/6">Price</div>
                            <div className="w-1/6">Quantity</div>
                            <div className="w-1/6">Total</div>
                        </div>

                        {/* Cart items */}
                        {loading ? (
                            // Loading skeleton for cart items
                            Array.from({ length: 2 }).map((_, index) => (
                                <div key={index} className="flex flex-col md:flex-row items-center border-b border-gray-200 py-4 animate-pulse">
                                    <div className="w-full md:w-1/2 flex items-center space-x-4">
                                        <div className="h-40 w-40 bg-gray-200 rounded"></div>
                                        <div className="flex flex-col items-start space-y-2">
                                            <div className="h-4 bg-gray-200 rounded w-32"></div>
                                            <div className="h-3 bg-gray-200 rounded w-24"></div>
                                            <div className="h-3 bg-gray-200 rounded w-16"></div>
                                        </div>
                                    </div>
                                    <div className="w-full md:w-1/6 mt-2 md:mt-0">
                                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                                    </div>
                                    <div className="w-full md:w-1/6 mt-2 md:mt-0">
                                        <div className="h-8 bg-gray-200 rounded w-12"></div>
                                    </div>
                                    <div className="w-full md:w-1/6 mt-2 md:mt-0">
                                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            cartItems.map((item) => {
                            const productTotal = item.product.price * item.quantity;
                            const stockLabel = stockOptions.find(
                                (option) => option.value === item.product.stockStatus
                            )?.label;

                            return (
                                <div
                                    key={item.product.id}
                                    className="flex flex-col md:flex-row items-center border-b border-gray-200 py-4"
                                >
                                    {/* Product Image & Info */}
                                    <div className="w-full md:w-1/2 flex items-center space-x-4">
                                        {item.product.images && item.product.images.length > 0 && (
                                            <img
                                                className="h-40 w-40 object-contain"
                                                src={item.product.images[0]}
                                                alt={item.product.name}
                                            />
                                        )}
                                        <div className="flex flex-col items-start">
                                            <h3 className="font-semibold text-gray-800">
                                                {item.product.name}
                                            </h3>
                                            <div className="text-sm text-gray-500">
                                                Vendor: {item.product.vendorName}
                                            </div>
                                            <div
                                                className={`text-xs italic ${
                                                    (item.product.stockStatus === "inStock" || !item.product.stockStatus)
                                                        ? "text-green-500"
                                                        : "text-red-500"
                                                }`}
                                            >
                                                {stockLabel || "In Stock"}
                                            </div>
                                            <button className="text-blue-500 text-sm mt-1 hover:underline">
                                                Remove
                                            </button>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="w-full md:w-1/6 text-gray-800 mt-2 md:mt-0">
                                        ${(item.product.price || 0).toFixed(2)}
                                    </div>

                                    {/* Quantity */}
                                    <div className="w-full md:w-1/6 flex items-center mt-2 md:mt-0">
                                        <span className="px-3 border">
                                            {item.quantity}
                                        </span>
                                    </div>

                                    {/* Total */}
                                    <div className="w-full md:w-1/6 font-semibold text-gray-800 mt-2 md:mt-0">
                                        ${productTotal.toFixed(2)}
                                    </div>
                                </div>
                            );
                        }))}

                        {/* Coupon & Clear Row */}
                        {!loading && (
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-6">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        placeholder="Coupon code"
                                        className="border p-2 rounded text-sm w-36"
                                    />
                                    <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors">
                                        OK
                                    </button>
                                </div>
                                <button 
                                    onClick={handleClearCart}
                                    disabled={clearingCart}
                                    className="text-red-500 mt-4 md:mt-0 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {clearingCart ? 'Clearing...' : 'Clear Shopping Cart'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right side: Order summary */}
                    <div className="w-full md:w-80 border rounded p-4 flex flex-col space-y-4 h-fit">
                        <h2 className="text-xl font-semibold text-gray-800">Cart Totals</h2>
                        <div className="border-b border-gray-300" />

                        {/* Subtotal */}
                        <div className="flex justify-between text-gray-700">
                            <span>Subtotal</span>
                            {loading ? (
                                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                            ) : (
                                <span>${subtotal.toFixed(2)}</span>
                            )}
                        </div>
                        
                        {/* Shipping */}
                        <div className="flex flex-col text-gray-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">Shipping</span>
                                {rates.length === 0 && !session?.user?.streetAddress && (
                                    <button 
                                        onClick={() => setShowAddressModal(true)}
                                        className="text-sm text-blue-600 hover:text-blue-800 underline bg-transparent border-none cursor-pointer"
                                    >
                                        Add address
                                    </button>
                                )}
                                {session?.user?.streetAddress && (
                                    <button 
                                        onClick={() => setShowAddressModal(true)}
                                        className="text-sm text-gray-600 hover:text-gray-800 underline bg-transparent border-none cursor-pointer"
                                    >
                                        Edit address
                                    </button>
                                )}
                            </div>
                            
                            {session?.user?.streetAddress ? (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-sm font-medium text-green-800">
                                            Shipping Address Added
                                        </span>
                                    </div>
                                    <div className="text-xs text-green-700 mt-1">
                                        {session.user.streetAddress}, {session.user.city}, {session.user.state} {session.user.zipCode}
                                    </div>
                                    <div className="text-xs text-green-600 mt-1">
                                        {shippingCalculationStatus === 'calculating' ? 'Calculating shipping rates...' :
                                         shippingCalculationStatus === 'success' ? 'Shipping rates calculated' :
                                         shippingCalculationStatus === 'failed' ? 'Failed to calculate shipping' :
                                         'Ready for shipping calculation'}
                                    </div>
                                </div>
                            ) : null}
                            
                            {rates.length > 0 ? (
                                <div className="space-y-3">
                                    {rates.map((rate, i) => (
                                        <div key={i} className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-gray-900 text-sm">
                                                                {rate.provider}
                                                            </div>
                                                            <div className="text-xs text-gray-600">
                                                                from {rate.sellerName}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-4 text-xs text-gray-600">
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            <span>{rate.estimatedDays} business days</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                            </svg>
                                                            <span>{rate.products.length} item{rate.products.length > 1 ? 's' : ''}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-green-600">
                                                        ${rate.amount.toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {rate.currency.toUpperCase()}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Total shipping cost */}
                                    {rates.length > 1 && (
                                        <div className="bg-gray-100 rounded-lg p-3 border-t-2 border-green-600">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-gray-900">Total Shipping Cost</span>
                                                <span className="text-lg font-bold text-green-600">${shippingCost.toFixed(2)}</span>
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                Rates calculated via Shippo
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Shipping info note */}
                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg">
                                        <div className="flex items-start">
                                            <svg className="w-4 h-4 text-blue-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div>
                                                <div className="text-sm font-medium text-blue-800">
                                                    Shipping Information
                                                </div>
                                                <div className="text-xs text-blue-700 mt-1">
                                                    • Rates are calculated in real-time via Shippo
                                                    <br />
                                                    • Delivery times are estimates and may vary
                                                    <br />
                                                    • Tracking information will be provided after purchase
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : !session?.user?.streetAddress ? (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                    <div className="flex items-start">
                                        <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-yellow-800 mb-1">
                                                Shipping Address Required
                                            </div>
                                            <div className="text-xs text-yellow-700 mb-3">
                                                We need your shipping address to calculate accurate shipping costs from our vendors.
                                            </div>
                                            <button 
                                                onClick={() => setShowAddressModal(true)}
                                                className="bg-yellow-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                                Add Shipping Address
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* Total */}
                        <div className="border-t border-gray-300 pt-2 flex justify-between text-gray-800 font-semibold">
                            <span>Total</span>
                            {loading ? (
                                <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                            ) : (
                                <span>${total.toFixed(2)}</span>
                            )}
                        </div>

                        {/* Shipping Status Indicator */}
                        {shippingCalculationStatus === 'calculating' && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span className="text-sm text-blue-800">Calculating shipping rates...</span>
                                </div>
                            </div>
                        )}
                        
                        {shippingCalculationStatus === 'failed' && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                    <svg className="w-4 h-4 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                    <div>
                                        <div className="text-sm font-medium text-red-800">Shipping Calculation Failed</div>
                                        <div className="text-xs text-red-700 mt-1">
                                            {shippingError || "Unable to calculate shipping rates"}
                                        </div>
                                        <div className="text-xs text-red-600 mt-1">
                                            This might be due to:
                                            <br />• Vendor address information missing
                                            <br />• Product shipping dimensions not set
                                            <br />• Temporary shipping service issue
                                        </div>
                                        <button 
                                            onClick={() => {
                                                // Retry shipping calculation
                                                if (session?.user && cartItems.length > 0) {
                                                    handleAddressAdded(); // Reuse the existing shipping calculation logic
                                                }
                                            }}
                                            className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors mt-2"
                                        >
                                            Retry Shipping Calculation
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Buttons (Checkout, Payment, etc.) */}
                        {!loading && shippingCalculationStatus === 'success' && rates.length > 0 ? (
                            <CheckoutButton vendorItems={vendorItems} />
                        ) : (
                            <div className="space-y-2">
                                <button 
                                    disabled 
                                    className="w-full bg-gray-300 text-gray-500 px-4 py-2 rounded cursor-not-allowed"
                                >
                                    {loading 
                                        ? "Loading Cart..."
                                        : !session?.user?.streetAddress 
                                        ? "Add Shipping Address to Continue" 
                                        : shippingCalculationStatus === 'calculating'
                                        ? "Calculating Shipping..."
                                        : shippingCalculationStatus === 'failed'
                                        ? "Shipping Unavailable"
                                        : "Checkout Unavailable"
                                    }
                                </button>
                                <div className="text-xs text-gray-600 text-center">
                                    {loading
                                        ? "Please wait while we load your cart items"
                                        : !session?.user?.streetAddress 
                                        ? "We need your shipping address to calculate shipping costs"
                                        : shippingCalculationStatus === 'failed'
                                        ? "Unable to calculate shipping rates. Please try again later."
                                        : "Shipping rates must be calculated before checkout"
                                    }
                                </div>
                            </div>
                        )}
                        <Link href="/shop" className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-center">
                            CONTINUE SHOPPING
                        </Link>
                    </div>
                </div>
            </div>

            {/* Shipping Address Modal */}
            <ShippingAddressModal 
                isOpen={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                onAddressAdded={handleAddressAdded}
            />
        </NoXRedirect>
    );
}