import { NextRequest, NextResponse } from "next/server";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        try {
            // Use Firebase client SDK to send password reset email
            // This automatically handles email sending
            await sendPasswordResetEmail(auth, email, {
                url: process.env.NEXT_PUBLIC_URL ? `${process.env.NEXT_PUBLIC_URL}/reset-password` : 'http://localhost:3000/reset-password',
                handleCodeInApp: true,
            });

            console.log(`Password reset email sent to: ${email}`);

            return NextResponse.json({ 
                message: "If an account with that email exists, a password reset link has been sent."
            });

        } catch (error: any) {
            console.error("Error sending password reset email:", error);
            
            // Check if user doesn't exist
            if (error.code === 'auth/user-not-found') {
                // For security reasons, don't reveal if the user exists or not
                return NextResponse.json({ 
                    message: "If an account with that email exists, a password reset link has been sent." 
                });
            }

            return NextResponse.json({ 
                error: "Failed to send password reset email" 
            }, { status: 500 });
        }

    } catch (error) {
        console.error("Error in forgot password endpoint:", error);
        return NextResponse.json({ 
            error: "Internal server error" 
        }, { status: 500 });
    }
} 