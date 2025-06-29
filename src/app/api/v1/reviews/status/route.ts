import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { requireRole } from '@/app/api/utils/withRole';
import { doc, updateDoc } from 'firebase/firestore';

export async function PUT(request: NextRequest) {
    const user = await requireRole(request, 'vendor');
    if (user instanceof NextResponse) return user;

    try {
        const { reviewId, status } = await request.json();

        if (!reviewId || !status || !['Published', 'Hidden'].includes(status)) {
            return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
        }

        // Update the review status in Firestore
        const reviewRef = doc(db, 'productReviews', reviewId);
        await updateDoc(reviewRef, {
            status,
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating review status:', error);
        return NextResponse.json({ error: 'Failed to update review status' }, { status: 500 });
    }
} 