import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function GET(_request: NextRequest): Promise<NextResponse> {
    try {
        const productsRef = collection(db, "products");
        const snapshot = await getDocs(productsRef);
        
        const categoriesSet = new Set<string>();
        const tagsSet = new Set<string>();
        
        snapshot.docs.forEach((doc) => {
            const data = doc.data();
            
            // Only include published products (not drafts)
            if (data.isDraft) return;
            
            // Collect categories
            if (data.catagories && Array.isArray(data.catagories)) {
                data.catagories.forEach((category: string) => {
                    if (category && category.trim()) {
                        categoriesSet.add(category.trim());
                    }
                });
            }
            
            // Collect tags
            if (data.tags && Array.isArray(data.tags)) {
                data.tags.forEach((tag: string) => {
                    if (tag && tag.trim()) {
                        tagsSet.add(tag.trim());
                    }
                });
            }
        });
        
        const categories = Array.from(categoriesSet).sort();
        const tags = Array.from(tagsSet).sort();
        
        return NextResponse.json({
            categories,
            tags
        });
    } catch (error) {
        console.error("Error fetching filters:", error);
        return NextResponse.json(
            { error: "Failed to fetch filters" },
            { status: 500 }
        );
    }
} 