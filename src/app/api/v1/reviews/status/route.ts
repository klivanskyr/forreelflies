import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { withRole } from '@/app/api/utils/withRole';
import { doc, updateDoc } from 'firebase/firestore';

export const PUT = withRole(['vendor'], async (req: Request) => {
    try {
        const { reviewId, status } = await req.json();

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
}); 