import Link from "next/link";
import { Product } from "../types/types";
import NoXRedirect from "@/Components/NoXRedirect";
import Breadcrumbs from "@/Components/Breadcrumbs";
import { calculateShipping } from "@/helpers/calculateShipping";

type CartId = {
    id: string,
    quantity: number,
}

export type CartItem = {
    product: Product,
    quantity: number,
};

export default async function Page() {
    const { tokenToUser } = await import("@/lib/firebase-admin");
    const user = await tokenToUser();

    if (!user) {
        return <></>;
    }

    
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/user/cart?id=${user?.uid}`,
        {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    const data = await response.json();
    const cartIds: CartId[] = data.data as CartId[]; // Object with productId as keys and quantity as values

    const promises: Promise<CartItem>[] = cartIds.map((cartId) => {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/product?id=${cartId.id}`;
        return fetch(`${process.env.NEXT_PUBLIC_API_URL}/product?id=${cartId.id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        }).then(async (res) => {
            const productData = await res.json();
            return { product: productData.data as Product, quantity: cartId.quantity };
        })
    });

    const cartItems = await Promise.all(promises);
    // console.log(cartItems);

    const stockOptions = [
        { value: "inStock", label: "In Stock" },
        { value: "lowStock", label: "Low Stock" },
        { value: "outOfStock", label: "Out of Stock" },
    ]

    // Calculate subtotal
    const subtotal = cartItems
        .map(item => item.product.price * item.quantity)
        .reduce((acc, val) => acc + val, 0);

    // Dummy shipping/tax
    const [rates, err] = await calculateShipping(user, cartItems.map(item => item.product));
    if (err) {
        console.error(err);
    }

    const shippingCost = rates.reduce((acc, rate) => acc + rate.amount, 0);
    const tax = 0;
    const total = subtotal + shippingCost + tax;

    return (
        <NoXRedirect x={user} redirectUrl="/?login=true">
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
                        {cartItems.map((item) => {
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
                                                    item.product.stockStatus === "inStock"
                                                        ? "text-green-500"
                                                        : "text-red-500"
                                                }`}
                                            >
                                                {stockLabel}
                                            </div>
                                            <button className="text-blue-500 text-sm mt-1 hover:underline">
                                                Remove
                                            </button>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="w-full md:w-1/6 text-gray-800 mt-2 md:mt-0">
                                        ${item.product.price.toFixed(2)}
                                    </div>

                                    {/* Quantity */}
                                    <div className="w-full md:w-1/6 flex items-center mt-2 md:mt-0">
                                        {/* <button className="px-2 border rounded-l">-</button> */}
                                        <span className="px-3 border">
                                            {item.quantity}
                                        </span>
                                        {/* <button className="px-2 border rounded-r">+</button> */}
                                    </div>

                                    {/* Total */}
                                    <div className="w-full md:w-1/6 font-semibold text-gray-800 mt-2 md:mt-0">
                                        ${productTotal.toFixed(2)}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Coupon & Clear Row */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-6">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    placeholder="Coupon code"
                                    className="border p-2 rounded text-sm w-36"
                                />
                                <button className="greenButton">
                                    OK
                                </button>
                            </div>
                            <button className="text-red-500 mt-4 md:mt-0 hover:underline">
                                Clear Shopping Cart
                            </button>
                        </div>
                    </div>

                    {/* Right side: Order summary */}
                    <div className="w-full md:w-80 border rounded p-4 flex flex-col space-y-4 h-fit">
                        <h2 className="text-xl font-semibold text-gray-800">Cart Totals</h2>
                        <div className="border-b border-gray-300" />

                        {/* Subtotal */}
                        <div className="flex justify-between text-gray-700">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        
                        {/* Shipping */}
                        <div className="flex flex-col text-gray-700">
                            <div className="text-sm text-gray-500 flex flex-col justify-between">
                                {rates.map((rate, i) => (
                                    <div key={i}>{rate.sellerName} --- {rate.provider}, Estimated Days: {rate.estimatedDays}: <span className="font-semibold">${rate.amount}</span></div>
                                ))}
                                {/* <CalculateShippingButton user={user} products={cartItems.map(item => item.product)} /> */}
                            </div>
                        </div>

                        {/* Total */}
                        <div className="border-t border-gray-300 pt-2 flex justify-between text-gray-800 font-semibold">
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>

                        {/* Buttons (Checkout, Payment, etc.) */}
                        <Link href="/checkout" className="greenButton text-center">
                            PROCEED TO CHECKOUT
                        </Link>
                        <Link href="/shop" className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-center">
                            CONTINUE SHOPPING
                        </Link>
                    </div>
                </div>
            </div>
        </NoXRedirect>
    );
}


{/* <NoXRedirect x={user} redirectUrl="/?login=true">
            <div className="shadow-card p-8 m-8">
                <h1 className="text-3xl">Shopping Cart</h1>
                <div className="w-full h-[1px] bg-gray-400 my-4"/>
                <div>       
                </div>
                <div className="flex flex-col gap-4 w-full h-full px-4 py-2">
                    {cartItems.map((item, i) => (
                        <div key={item.product.id} className="border-2 flex flex-row items-center gap-4 p-4">
                            {item.product?.images && <div className="w-[25%] flex items-center justify-center overflow-hidden"><img className="h-full object-contain" src={item.product.images[0]} alt={item.product.name} /></div>}
                            <div className="flex flex-col h-full justify-center">
                                <h2 className="font-bold">{item.product.name.split(" ").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ")}</h2>
                                <p>Vendor: {item.product.vendorName}</p>
                                <p className={`${item.product.stockStatus == "inStock" ? "text-green-500" : "text-red-500"} italic`}>
                                    {stockOptions.find(option => option.value === item.product?.stockStatus)?.label}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </NoXRedirect> */}