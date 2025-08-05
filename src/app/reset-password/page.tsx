"use client";
import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import Input from "@/components/inputs/Input";
import Button from "@/components/buttons/Button";
import { toast } from "sonner";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getAuth, confirmPasswordReset, verifyPasswordResetCode, ActionCodeInfo } from "firebase/auth";
import { auth } from "@/lib/firebase";

function ResetPasswordContent() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidating, setIsValidating] = useState(true);
    const [isValid, setIsValid] = useState(false);
    const [email, setEmail] = useState("");
    const [resetSuccess, setResetSuccess] = useState(false);
    
    const searchParams = useSearchParams();
    const oobCode = searchParams.get("oobCode");

    useEffect(() => {
        const validateResetCode = async () => {
            if (!oobCode) {
                setIsValidating(false);
                setIsValid(false);
                return;
            }

            try {
                // Use Firebase client SDK to verify the reset code
                const email = await verifyPasswordResetCode(auth, oobCode);
                setIsValid(true);
                setEmail(email || "");
            } catch (error: any) {
                console.error("Error validating reset code:", error);
                setIsValid(false);
                setEmail("");
                setIsValidating(false);
            }
        };

        validateResetCode();
    }, [oobCode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!password || !confirmPassword) {
            toast.error("Please fill in all fields");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        setIsSubmitting(true);

        try {
            // Use Firebase client SDK to confirm password reset
            await confirmPasswordReset(auth, oobCode!, password);
            
            setResetSuccess(true);
            toast.success("Password reset successfully!");
        } catch (error: any) {
            console.error("Error resetting password:", error);
            
            // Handle specific Firebase Auth errors
            if (error.code === 'auth/invalid-action-code') {
                toast.error("Invalid or expired reset link");
            } else if (error.code === 'auth/expired-action-code') {
                toast.error("Reset link has expired");
            } else if (error.code === 'auth/weak-password') {
                toast.error("Password is too weak");
            } else {
                toast.error("Failed to reset password. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isValidating) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                            <h2 className="mt-4 text-xl font-medium text-gray-900">
                                Validating reset link...
                            </h2>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!isValid) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                                Invalid reset link
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                                This password reset link is invalid or has expired.
                            </p>
                            <div className="mt-6">
                                <Link
                                    href="/forgot-password"
                                    className="text-green-600 hover:text-green-500 font-medium"
                                >
                                    Request a new reset link
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (resetSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                                Password reset successfully!
                            </h2>
                            <p className="mt-2 text-sm text-gray-600">
                                Your password has been updated. You can now sign in with your new password.
                            </p>
                            <div className="mt-6">
                                <Link
                                    href="/"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                                >
                                    Sign in
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-extrabold text-gray-900">
                            Reset your password
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Enter your new password below.
                        </p>
                        {email && (
                            <p className="mt-1 text-sm text-gray-500">
                                Resetting password for: <strong>{email}</strong>
                            </p>
                        )}
                    </div>

                    <motion.form
                        className="space-y-6"
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Input
                            name="password"
                            type="password"
                            label="New password"
                            placeholder="Enter your new password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                        />

                        <Input
                            name="confirmPassword"
                            type="password"
                            label="Confirm new password"
                            placeholder="Confirm your new password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                        />

                        <Button
                            text={isSubmitting ? "Resetting..." : "Reset password"}
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full"
                        />
                    </motion.form>

                    <div className="mt-6 text-center">
                        <Link
                            href="/"
                            className="text-green-600 hover:text-green-500 font-medium"
                        >
                            Back to sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                            <h2 className="mt-4 text-xl font-medium text-gray-900">
                                Loading...
                            </h2>
                        </div>
                    </div>
                </div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}