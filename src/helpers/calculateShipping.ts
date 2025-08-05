import { Product, Rate, Vendor } from "@/app/types/types"
import { DbUser } from "@/lib/firebase-admin"

type T = {
    object_id: string;
    amount: string;
    currency: string;
    provider: string;
    attributes: string[];
    estimated_days: number;
}

export async function calculateShipping(buyer: DbUser, products: Product[]): Promise<[Rate[], string]> {
    console.log("calculateShipping called with buyer:", {
        uid: buyer.uid,
        username: buyer.username,
        hasAddress: !!(buyer.streetAddress && buyer.city && buyer.state && buyer.zipCode),
        address: {
            street: buyer.streetAddress,
            city: buyer.city,
            state: buyer.state,
            zip: buyer.zipCode,
            country: buyer.country
        }
    });

    // Create buyer address
    const addressTo = {
        name: buyer.username,
        street1: buyer.streetAddress,
        city: buyer.city,
        state: buyer.state,
        zip: buyer.zipCode,
        country: buyer.country,
    }

    // Get unique seller IDs
    const sellerIds = [...new Set(products.map((product) => product.vendorId))];

    // Get rates for each seller
    const ratesPromises = sellerIds.map(async (sellerId) => {
        const sellerProducts = products.filter((product) => product.vendorId === sellerId);
        const parcels = sellerProducts.map((product) => ({
            length: String(product.shippingLength || 6),
            width: String(product.shippingWidth || 4),
            height: String(product.shippingHeight || 2),
            distanceUnit: "in",
            weight: String(product.shippingWeight || 1),
            massUnit: "lb",
            template: "USPS_IrregularParcel" // Default to irregular parcel for flexibility
        }));

        try {
            // Fetch seller info - use relative paths for client-side requests
            const sellerInfoResponse = await fetch(`/api/v1/vendor?vendorId=${sellerId}`, {
                credentials: 'include'
            });
            if (!sellerInfoResponse.ok) {
                console.error(`Failed to fetch vendor info for ${sellerId}:`, sellerInfoResponse.status);
                return null;
            }
            
            const data2 = await sellerInfoResponse.json();
            if (!data2 || !data2.vendor) {
                console.error("No vendor data found for:", sellerId);
                return null;
            }
            const vendor: Vendor = data2.vendor;

            const addressFrom = {
                name: vendor.storeName,
                street1: vendor.storeStreetAddress,
                city: vendor.storeCity,
                state: vendor.storeState,
                zip: vendor.storeZip,
                country: vendor.storeCountry,
            };

            // Validate addresses
            if (!addressFrom.street1 || !addressFrom.city || !addressFrom.state || !addressFrom.zip) {
                console.error("Incomplete vendor address:", addressFrom);
                return null;
            }

            if (!addressTo.street1 || !addressTo.city || !addressTo.state || !addressTo.zip) {
                console.error("Incomplete buyer address:", addressTo);
                console.error("Missing fields:", {
                    street: !addressTo.street1 ? "MISSING" : "OK",
                    city: !addressTo.city ? "MISSING" : "OK", 
                    state: !addressTo.state ? "MISSING" : "OK",
                    zip: !addressTo.zip ? "MISSING" : "OK"
                });
                return null;
            }

            // Fetch shipping rates
            const response = await fetch(`/api/v1/shipping/shipment`, {
                method: "POST",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    addressFrom,
                    addressTo,
                    parcels,
                    async: false
                }),
            });

            if (!response.ok) {
                console.error("Failed to fetch shipping rates:", response.status);
                const error = await response.json().catch(() => ({ error: "Unknown error" }));
                console.error("Shipping API error:", error);
                return null;
            }

            const rates: T[] = await response.json();
            console.log(`Received ${rates.length} rates for vendor ${sellerId}:`, rates);

            if (!rates || rates.length === 0) {
                console.error("No shipping rates returned for vendor:", sellerId);
                return null;
            }

            const sellerInfo = {
                vendorId: sellerId,
                vendorName: vendor.storeName,
            };

            return { rates, sellerInfo };
        } catch (error) {
            console.error(`Error fetching rates for vendor ${sellerId}:`, error);
            return null;
        }
    });

    const ratesResponses = await Promise.all(ratesPromises);

    // Filter out null responses
    const validResponses = ratesResponses.filter((response) => response !== null);

    if (validResponses.length === 0) {
        return [[], "Failed to fetch shipping rates for any vendor"];
    }

    if (validResponses.length < sellerIds.length) {
        console.warn(`Only got rates for ${validResponses.length} out of ${sellerIds.length} vendors`);
    }

    // Select the cheapest rate per vendor
    const rates: Rate[] = validResponses.map((response) => {
        const sellerRates = response!.rates;
        const sellerId = response!.sellerInfo.vendorId;
        const sellerName = response!.sellerInfo.vendorName;
        
        console.log(`Processing rates for vendor ${sellerName} (${sellerId}):`, sellerRates);

        // First try to find a rate with "CHEAPEST" attribute
        let cheapestRate = sellerRates.find((rate) => rate.attributes.includes("CHEAPEST"));
        
        // If no "CHEAPEST" attribute, find the rate with lowest amount
        if (!cheapestRate && sellerRates.length > 0) {
            cheapestRate = sellerRates.reduce((min, rate) => {
                const minAmount = parseFloat(min.amount);
                const rateAmount = parseFloat(rate.amount);
                return rateAmount < minAmount ? rate : min;
            }, sellerRates[0]);
            console.log(`No CHEAPEST attribute found, selected cheapest by amount: $${cheapestRate.amount}`);
        }

        if (!cheapestRate) {
            console.error(`No valid shipping rate found for vendor ${sellerName}`);
            return null;
        }

        console.log(`Selected rate for ${sellerName}: $${cheapestRate.amount} via ${cheapestRate.provider}`);

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

    if (rates.length === 0) {
        return [[], "No valid shipping rates available"];
    }

    console.log(`Successfully calculated shipping for ${rates.length} vendors:`, rates);
    return [rates, ""];
}
