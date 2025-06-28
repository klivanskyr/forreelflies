import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { withRole } from '@/app/api/utils/withRole';
import { doc, updateDoc } from 'firebase/firestore';

export const POST = withRole(['vendor'], async (req: Request) => {
    try {
        const { reviewId, response } = await req.json();

        if (!reviewId || typeof response !== 'string') {
            return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
        }

        // Update the review with the vendor's response
        const reviewRef = doc(db, 'productReviews', reviewId);
        await updateDoc(reviewRef, {
            vendorResponse: response,
            vendorResponseDate: new Date().toISOString()
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error adding review response:', error);
        return NextResponse.json({ error: 'Failed to add review response' }, { status: 500 });
    }
}); 