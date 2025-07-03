import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/utils/adminAuth";
import Stripe from "stripe";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

export async function POST(request: NextRequest) {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    if (authResult !== true) {
        return authResult;
    }
    
    try {
        const { accountId, action } = await request.json();
        
        if (!accountId) {
            return NextResponse.json({ error: "accountId is required" }, { status: 400 });
        }
        
        if (action === 'check') {
            return await checkAccount(accountId);
        } else if (action === 'create') {
            return await createVendor(accountId);
        } else {
            return NextResponse.json({ error: "Invalid action. Use 'check' or 'create'" }, { status: 400 });
        }
        
    } catch (error) {
        console.error("Error in fix-vendor endpoint:", error);
        return NextResponse.json({ 
            error: "Internal server error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

async function checkAccount(accountId: string) {
    try {
        // Get the Stripe account
        const account = await stripe.accounts.retrieve(accountId);
        const userId = account.metadata?.userId;
        
        const result = {
            accountId: account.id,
            userId,
            account: {
                details_submitted: account.details_submitted,
                charges_enabled: account.charges_enabled,
                payouts_enabled: account.payouts_enabled,
                requirements: account.requirements?.currently_due?.length || 0
            },
            isFullyOnboarded: account.details_submitted && account.charges_enabled && account.payouts_enabled,
            vendor: null as any,
            user: null as any,
            vendorRequest: null as any,
            canCreateVendor: false,
            issues: [] as string[]
        };
        
        if (!userId) {
            result.issues.push("No userId found in account metadata");
            return NextResponse.json(result);
        }
        
        // Check if vendor exists
        const vendorQuery = query(collection(db, "vendors"), where("ownerId", "==", userId));
        const vendorSnapshot = await getDocs(vendorQuery);
        
        if (!vendorSnapshot.empty) {
            const vendorData = vendorSnapshot.docs[0].data();
            result.vendor = {
                exists: true,
                storeName: vendorData.storeName,
                stripeAccountId: vendorData.stripeAccountId,
                hasStripeAccountId: !!vendorData.stripeAccountId
            };
            
            if (!vendorData.stripeAccountId) {
                result.issues.push("Vendor exists but missing stripeAccountId");
            }
        } else {
            result.vendor = { exists: false };
            if (result.isFullyOnboarded) {
                result.issues.push("Account is fully onboarded but no vendor exists");
            }
        }
        
        // Check user status
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            result.user = {
                exists: true,
                vendorSignUpStatus: userData.vendorSignUpStatus,
                isVendor: userData.isVendor
            };
            
            if (result.isFullyOnboarded && userData.vendorSignUpStatus !== 'onboardingCompleted') {
                result.issues.push(`User status should be 'onboardingCompleted', currently: ${userData.vendorSignUpStatus}`);
            }
        } else {
            result.user = { exists: false };
            result.issues.push("User document not found");
        }
        
        // Check vendor request
        const vendorRequestDoc = await getDoc(doc(db, "vendorRequests", userId));
        if (vendorRequestDoc.exists()) {
            const vendorRequestData = vendorRequestDoc.data();
            result.vendorRequest = {
                exists: true,
                storeName: vendorRequestData.storeName,
                isApproved: vendorRequestData.isApproved
            };
            
            result.canCreateVendor = result.isFullyOnboarded && 
                                   !result.vendor.exists && 
                                   result.vendorRequest.exists;
        } else {
            result.vendorRequest = { exists: false };
            result.issues.push("No vendor request found");
        }
        
        return NextResponse.json(result);
        
    } catch (error) {
        console.error("Error checking account:", error);
        return NextResponse.json({ 
            error: "Failed to check account",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

async function createVendor(accountId: string) {
    try {
        // Get the Stripe account
        const account = await stripe.accounts.retrieve(accountId);
        const userId = account.metadata?.userId;
        
        if (!userId) {
            return NextResponse.json({ 
                error: "No userId found in account metadata" 
            }, { status: 400 });
        }
        
        // Check if account is fully onboarded
        const isOnboarded = account.details_submitted && 
                           account.charges_enabled && 
                           account.payouts_enabled;
        
        if (!isOnboarded) {
            return NextResponse.json({ 
                error: "Account is not fully onboarded",
                account: {
                    details_submitted: account.details_submitted,
                    charges_enabled: account.charges_enabled,
                    payouts_enabled: account.payouts_enabled
                }
            }, { status: 400 });
        }
        
        // Check if vendor already exists
        const vendorQuery = query(collection(db, "vendors"), where("ownerId", "==", userId));
        const vendorSnapshot = await getDocs(vendorQuery);
        
        if (!vendorSnapshot.empty) {
            const vendorData = vendorSnapshot.docs[0].data();
            
            // Update existing vendor with Stripe account ID if missing
            if (!vendorData.stripeAccountId) {
                await updateDoc(vendorSnapshot.docs[0].ref, {
                    stripeAccountId: account.id,
                    updatedAt: new Date()
                });
                
                return NextResponse.json({
                    success: true,
                    action: "updated",
                    message: "Updated existing vendor with Stripe account ID",
                    vendor: {
                        id: vendorData.id,
                        storeName: vendorData.storeName,
                        stripeAccountId: account.id
                    }
                });
            } else {
                return NextResponse.json({ 
                    error: "Vendor already exists and has Stripe account ID",
                    vendor: {
                        id: vendorData.id,
                        storeName: vendorData.storeName,
                        stripeAccountId: vendorData.stripeAccountId
                    }
                }, { status: 400 });
            }
        }
        
        // Get vendor request data
        const vendorRequestDoc = await getDoc(doc(db, "vendorRequests", userId));
        if (!vendorRequestDoc.exists()) {
            return NextResponse.json({ 
                error: "No vendor request found for user" 
            }, { status: 400 });
        }
        
        const vendorRequestData = vendorRequestDoc.data();
        
        // Create vendor document
        const vendorData = {
            id: userId,
            ownerId: userId,
            ownerName: vendorRequestData.name,
            products: [],
            storeCity: vendorRequestData.storeCity,
            storeCountry: vendorRequestData.storeCountry || "US",
            storeDescription: vendorRequestData.storeDescription,
            storeEmail: vendorRequestData.storeEmail,
            storeName: vendorRequestData.storeName,
            storePhone: vendorRequestData.storePhone,
            storeSlug: vendorRequestData.storeSlug || vendorRequestData.storeName?.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            storeState: vendorRequestData.storeState,
            storeStreetAddress: vendorRequestData.storeStreetAddress,
            storeZip: vendorRequestData.storeZip,
            monthlyEarnings: 0,
            allTimeEarnings: 0,
            lastEarningsUpdate: new Date(),
            stripeAccountId: account.id,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        // Save vendor document
        await setDoc(doc(db, "vendors", userId), vendorData);
        
        // Update user status
        await updateDoc(doc(db, "users", userId), {
            vendorSignUpStatus: "onboardingCompleted",
            isVendor: true
        });
        
        return NextResponse.json({
            success: true,
            action: "created",
            message: "Vendor created successfully",
            vendor: {
                id: vendorData.id,
                storeName: vendorData.storeName,
                stripeAccountId: account.id
            }
        });
        
    } catch (error) {
        console.error("Error creating vendor:", error);
        return NextResponse.json({ 
            error: "Failed to create vendor",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    // Check admin authentication
    const authResult = await requireAdmin(request);
    if (authResult !== true) {
        return authResult;
    }
    
    try {
        // Get all Stripe Connect accounts and check their status
        const accounts = await stripe.accounts.list({ limit: 100 });
        const results = [];
        
        for (const account of accounts.data) {
            const userId = account.metadata?.userId;
            
            if (!userId) continue;
            
            const isOnboarded = account.details_submitted && 
                               account.charges_enabled && 
                               account.payouts_enabled;
            
            if (isOnboarded) {
                // Check if vendor exists
                const vendorQuery = query(collection(db, "vendors"), where("ownerId", "==", userId));
                const vendorSnapshot = await getDocs(vendorQuery);
                
                results.push({
                    accountId: account.id,
                    userId,
                    isOnboarded,
                    hasVendor: !vendorSnapshot.empty,
                    vendorName: vendorSnapshot.empty ? null : vendorSnapshot.docs[0].data().storeName,
                    needsAttention: vendorSnapshot.empty
                });
            }
        }
        
        return NextResponse.json({
            total: results.length,
            needsAttention: results.filter(r => r.needsAttention).length,
            accounts: results
        });
        
    } catch (error) {
        console.error("Error listing accounts:", error);
        return NextResponse.json({ 
            error: "Failed to list accounts",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
} 