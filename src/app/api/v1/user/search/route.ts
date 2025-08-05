import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/utils/adminAuth";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Check if user is authenticated as admin
        const adminAuth = await requireAdmin(request);
        if (adminAuth instanceof NextResponse) return adminAuth;

        const { searchParams } = new URL(request.url);
        const searchTerm = searchParams.get('q');

        console.log('Search request received for term:', searchTerm);

        try {
            console.log('Executing Firestore queries...');
            
            // First, let's just get all users to see if there are any
            const allUsersQuery = query(
                collection(db, "users"),
                limit(50)
            );
            
            const allUsersSnapshot = await getDocs(allUsersQuery);
            console.log(`Total users in database: ${allUsersSnapshot.docs.length}`);
            
            if (allUsersSnapshot.docs.length === 0) {
                console.log('No users found in database');
                return NextResponse.json({ users: [] }, { status: 200 });
            }
            
            // Show sample of users for debugging
            allUsersSnapshot.docs.slice(0, 3).forEach((doc, index) => {
                const userData = doc.data();
                console.log(`User ${index + 1}:`, {
                    uid: doc.id,
                    email: userData.email,
                    username: userData.username,
                    vendorSignUpStatus: userData.vendorSignUpStatus
                });
            });
            
            // If search term is provided, filter users
            if (searchTerm && searchTerm.length >= 1) {
                // Search by email (exact match or contains)
                const emailQuery = query(
                    collection(db, "users"),
                    where("email", ">=", searchTerm),
                    where("email", "<=", searchTerm + '\uf8ff'),
                    limit(10)
                );

                // Search by username (contains)
                const usernameQuery = query(
                    collection(db, "users"),
                    where("username", ">=", searchTerm),
                    where("username", "<=", searchTerm + '\uf8ff'),
                    limit(10)
                );

                const [emailSnapshot, usernameSnapshot] = await Promise.all([
                    getDocs(emailQuery),
                    getDocs(usernameQuery)
                ]);

                console.log(`Email search found ${emailSnapshot.docs.length} results`);
                console.log(`Username search found ${usernameSnapshot.docs.length} results`);

                // Combine and deduplicate results
                const users = new Map();
                
                emailSnapshot.docs.forEach(doc => {
                    const userData = doc.data();
                    users.set(doc.id, {
                        uid: doc.id,
                        email: userData.email,
                        username: userData.username,
                        phoneNumber: userData.phoneNumber,
                        streetAddress: userData.streetAddress,
                        city: userData.city,
                        state: userData.state,
                        zipCode: userData.zipCode,
                        country: userData.country,
                        vendorSignUpStatus: userData.vendorSignUpStatus || "notStarted"
                    });
                });

                usernameSnapshot.docs.forEach(doc => {
                    const userData = doc.data();
                    if (!users.has(doc.id)) {
                        users.set(doc.id, {
                            uid: doc.id,
                            email: userData.email,
                            username: userData.username,
                            phoneNumber: userData.phoneNumber,
                            streetAddress: userData.streetAddress,
                            city: userData.city,
                            state: userData.state,
                            zipCode: userData.zipCode,
                            country: userData.country,
                            vendorSignUpStatus: userData.vendorSignUpStatus || "notStarted"
                        });
                    }
                });

                const usersArray = Array.from(users.values());
                console.log(`Combined search results: ${usersArray.length} unique users`);
                
                // Show all users, but mark their vendor status
                const allUsers = usersArray.map(user => ({
                    ...user,
                    canUpgrade: user.vendorSignUpStatus === "notStarted" || user.vendorSignUpStatus === "submittedApprovalForm"
                }));

                console.log(`Returning ${allUsers.length} users (including existing vendors)`);

                return NextResponse.json({ 
                    users: allUsers.slice(0, 10) 
                }, { status: 200 });
            } else {
                // Return all users (including vendors)
                const allUsers = allUsersSnapshot.docs.map(doc => {
                    const userData = doc.data();
                    return {
                        uid: doc.id,
                        email: userData.email,
                        username: userData.username,
                        phoneNumber: userData.phoneNumber,
                        streetAddress: userData.streetAddress,
                        city: userData.city,
                        state: userData.state,
                        zipCode: userData.zipCode,
                        country: userData.country,
                        vendorSignUpStatus: userData.vendorSignUpStatus || "notStarted",
                        canUpgrade: userData.vendorSignUpStatus === "notStarted" || userData.vendorSignUpStatus === "submittedApprovalForm"
                    };
                });
                
                console.log(`Returning ${allUsers.length} total users (including existing vendors)`);

                return NextResponse.json({ 
                    users: allUsers.slice(0, 10) 
                }, { status: 200 });
            }

        } catch (error) {
            console.error("Error searching users:", error);
            return NextResponse.json({ 
                error: "Failed to search users",
                details: error instanceof Error ? error.message : "Unknown error"
            }, { status: 500 });
        }

    } catch (error) {
        console.error("Error in user search endpoint:", error);
        return NextResponse.json({ 
            error: "Internal server error",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
} 