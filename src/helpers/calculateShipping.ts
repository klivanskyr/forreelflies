import { Product, Rate, Vendor } from "@/app/types/types"
import { DbUser } from "@/lib/firebase-admin"

export async function calculateShipping(buyer: DbUser, products: Product[]): Promise<[Rate[], string]> {
    // Create buyer address
    const address_to = {
        name: buyer.username,
        street1: buyer.streetAddress,
        city: buyer.city,
        state: buyer.state,
        zip: buyer.zipCode,
        country: buyer.country,
    }


    // Get unique seller IDs
    const sellerIds = [...new Set(products.map((product) => product.vendorId))];
    const sellerNames = products.map((product) => product.vendorName);


    // Get rates for each seller
    const ratesPromises = sellerIds.map(async (sellerId) => {
        const sellerProducts = products.filter((product) => product.vendorId === sellerId);
        const parcels = sellerProducts.map((product) => ({
            length: product.shippingLength,
            width: product.shippingWidth,
            height: product.shippingHeight,
            distance_unit: "in",
            weight: product.shippingWeight,
            mass_unit: "lb",
        }));

        // Fetch seller info
        const sellerInfoResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor?vendorId=${sellerId}`);
        const data2 = await sellerInfoResponse.json();
        if (!data2) {
            console.log("No seller info found");
            return null;
        }
        const vendor: Vendor = data2.vendor;

        const address_from = {
            name: vendor.storeName,
            street1: vendor.storeStreetAddress,
            city: vendor.storeCity,
            state: vendor.storeState,
            zip: vendor.storeZip,
            country: vendor.storeCountry,
        };

        // Fetch shipping rates
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shipping/shipment`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                address_from,
                address_to,
                parcels,
            }),
        });

        if (!response.ok) {
            console.log("Failed to fetch rates");
            return null;
        }

        const sellerInfo: {
            vendorId: string;
            vendorName: string;
        } = {
            vendorId: sellerId,
            vendorName: vendor.storeName,
        }

        const rates = await response.json();
        return {rates, sellerInfo};
    });

    const ratesResponses = await Promise.all(ratesPromises); // Array of arrays of objects. Each array is the rates for each seller.

    // Select the cheapest rate per vendor
    const rates: Rate[] = ratesResponses.map((response) => {
        const sellerRates = response?.rates;
        const sellerId = response?.sellerInfo.vendorId;
        const sellerName = response?.sellerInfo.vendorName;
        const cheapestRate = sellerRates.find((rate: any) => rate.attributes.includes("CHEAPEST"));
        if (!cheapestRate) return null;

        return {
            products: products.filter((product) => product.vendorId === sellerId),
            objectId: cheapestRate.object_id,
            amount: parseFloat(cheapestRate.amount),
            currency: cheapestRate.currency,
            provider: cheapestRate.provider,
            estimatedDays: cheapestRate.estimated_days,
            sellerId: sellerId,
            sellerName: sellerName,
        };
    }).filter(Boolean) as Rate[];

    if (!rates) {
        return [[], "No rates available"];
    }

    return [rates, ""];
}
