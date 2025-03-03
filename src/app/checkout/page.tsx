// import Breadcrumbs from "@/Components/Breadcrumbs";
// import NoXRedirect from "@/Components/NoXRedirect";
// import { CartId, CartItem } from "../cart/page";
// import { Product, Rate } from "../types/types";
// import { calculateShipping } from "@/helpers/calculateShipping";
// import { VendorItem } from "../api/v1/checkout/route";
// import StripeCheckout from "@/Components/StripeCheckout";

export default async function Page() {
    return <></>
}
//     const { tokenToUser } = await import("@/lib/firebase-admin");
//     const user = await tokenToUser();

//     if (!user) {
//         return <h1>no user</h1>;
//     }

//     const response = await fetch(
//         `${process.env.NEXT_PUBLIC_API_URL}/user/cart?id=${user?.uid}`,
//         {
//             method: "GET",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//         }
//     );
    
//     const data = await response.json();
//     const cartIds: CartId[] = data.data as CartId[]; // Object with productId as keys and quantity as values

//     const promises: Promise<CartItem>[] = cartIds.map((cartId) => {
//         return fetch(`${process.env.NEXT_PUBLIC_API_URL}/product?id=${cartId.id}`, {
//             method: "GET",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//         }).then(async (res) => {
//             const productData = await res.json();
//             return { product: productData.data as Product, quantity: cartId.quantity };
//         })
//     });

//     const cartItems = await Promise.all(promises);

//     const userResponse = await fetch(`${process.env.API_URL}/user?uid=${user.uid}`, {
//         method: "GET",
//         headers: {
//             "Content-Type": "application/json",
//         },
//     });

//     const userData = await userResponse.json();

//     let rates: Rate[] = [];
//     if (user.streetAddress && user.city && user.state && user.zipCode && user.country) {
//         const [calculatedRates, err] = await calculateShipping(user, cartItems.map(item => item.product));
//         rates = calculatedRates;
//         if (err) {
//             console.error(err);
//         }
//     }

//     // Create a single Stripe Checkout Session for all vendors 
//     const sellerIds = cartItems.map((item) => item.product.vendorId);
//     const uniqueSellerIds = [...new Set(sellerIds)];
//     const sellerSessionsPromises = uniqueSellerIds.map((sellerId) => (
//         fetch(`${process.env.API_URL}/vendor?vendorId=${sellerId}`, {
//             method: "GET",
//             headers: {
//                 "Content-Type": "application/json",
//             }
//         })));
//     const sellerSessions = await Promise.all(sellerSessionsPromises);
//     const sellerDataPromises = await Promise.all(sellerSessions.map((session) => session.json()));
//     const sellerData = sellerDataPromises.map((data) => data.vendor);
    
//     const vendorItems: VendorItem[] = sellerData.map((vendor) => {
//         const vendorCartItems = cartItems.filter((item) => item.product.vendorId === vendor.id);
//         const shippingfee = rates.find((rate) => rate.sellerId === vendor.id)?.amount;

//         if (!shippingfee) {
//             console.error("Shipping fee not found for vendor: ", vendor.id);
//         }

//         return {
//             vendorId: vendor.id,
//             stripeAccountId: vendor.stripeAccountId,
//             cartItems: vendorCartItems,
//             shippingFee: shippingfee || 0,
//         }
//     });

//     const checkoutResponse = await fetch(`${process.env.API_URL}/checkout`, {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//             vendorItems,
//         }),
//     });

//     const checkoutInfo = await checkoutResponse.json();
//     console.log(checkoutInfo);


//     return (
//         <NoXRedirect x={user} redirectUrl="/?login=true">
//             <div className="flex flex-col w-full h-full items-center gap-4">
//                 <Breadcrumbs
//                     breadcrumbs={[
//                         { name: "Shopping Cart", href: "/cart" },
//                         { name: "Checkout", href: "/checkout" },
//                         { name: "Order Status", href: "/" },
//                     ]}
//                     activeIndex={1}
//                 />
//                 <StripeCheckout clientSecret={checkoutInfo.data.sessionId} />
//             </div>
//         </NoXRedirect>
//     )
// }