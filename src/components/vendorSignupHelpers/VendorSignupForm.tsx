'use client';

import Button from "@/components/buttons/Button";
import Input from "@/components/inputs/Input";
import { useState } from "react";
import Textarea from "../Textarea";
import { useRouter } from "next/navigation";
import emailjs from "@emailjs/browser";
import toast from "react-hot-toast";

export default function VendorSignupForm({ uid }: { uid: string | null }) {
    const router = useRouter();
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [input, setInput] = useState({
        name: "",
        storeName: "",
        storeSlug: "",
        storeEmail: "",
        storePhone: "",
        storeDescription: "",
        storeStreetAddress: "",
        storeCity: "",
        storeZip: "",
        storeCountry: "",
        storeState: "",
    });

    const handleStoreName = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStoreName = e.target.value;
        const slug = e.target.value.toLowerCase().replace(/ /g, "-");
        const slugWithoutsymbols = slug.replace(/[^a-zA-Z0-9-]/g, "");
        setInput({ ...input, storeName: newStoreName, storeSlug: slugWithoutsymbols });
    }

    const validateForm = () => {
        const requiredFields = [
            { field: input.name, name: "Owner Name" },
            { field: input.storeName, name: "Store Name" },
            { field: input.storeEmail, name: "Store Email" },
            { field: input.storePhone, name: "Store Phone" },
            { field: input.storeDescription, name: "Store Description" },
            { field: input.storeStreetAddress, name: "Street Address" },
            { field: input.storeCity, name: "City" },
            { field: input.storeZip, name: "ZIP Code" },
            { field: input.storeCountry, name: "Country" },
            { field: input.storeState, name: "State" }
        ];

        const missingFields = requiredFields.filter(({ field }) => !field.trim());
        
        if (missingFields.length > 0) {
            const fieldNames = missingFields.map(({ name }) => name).join(", ");
            toast.error(`Please fill in all required fields: ${fieldNames}`);
            return false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input.storeEmail)) {
            toast.error("Please enter a valid email address");
            return false;
        }

        // Phone validation
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(input.storePhone)) {
            toast.error("Please enter a valid phone number (at least 10 digits)");
            return false;
        }

        // ZIP code validation (basic US format)
        const zipRegex = /^\d{5}(-\d{4})?$/;
        if (!zipRegex.test(input.storeZip)) {
            toast.error("Please enter a valid ZIP code (e.g., 12345 or 12345-6789)");
            return false;
        }

        // Store name length validation
        if (input.storeName.length < 2) {
            toast.error("Store name must be at least 2 characters long");
            return false;
        }

        // Description length validation
        if (input.storeDescription.length < 50) {
            toast.error("Store description must be at least 50 characters long");
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        if (!uid) {
            toast.error("You must be logged in to submit a vendor application");
            router.push("/?login=true");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/request-vendor`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    uid,
                    ...input,
                }),
                cache: "no-cache",
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Vendor application submission failed:", errorData);
                
                if (response.status === 400) {
                    if (errorData.message?.includes("already exists")) {
                        toast.error("You have already submitted a vendor application. Please wait for review.");
                    } else {
                        toast.error("Invalid application data. Please check all fields and try again.");
                    }
                } else if (response.status === 401) {
                    toast.error("Authentication failed. Please log in and try again.");
                    router.push("/?login=true");
                } else if (response.status >= 500) {
                    toast.error("Server error. Please try again in a few minutes.");
                } else {
                    toast.error(`Application submission failed: ${errorData.message || "Unknown error"}`);
                }
                return;
            }

            // Try to send confirmation email (don't fail if this fails)
            try {
                await emailjs.send("service_67miukk", "template_2je91rh", {
                    uid,
                    ...input
                }, "gWJ3uFncMXWrKUMgw");
                console.log("Confirmation email sent successfully");
            } catch (emailError) {
                console.error("Failed to send confirmation email:", emailError);
                // Don't show error to user for email failure
            }

            setSubmitted(true);
            toast.success("Vendor application submitted successfully! We'll review your application and get back to you soon.");
            
        } catch (networkError) {
            console.error("Network error submitting vendor application:", networkError);
            
            if (networkError instanceof TypeError && networkError.message.includes("fetch")) {
                toast.error("Connection error. Please check your internet connection and try again.");
            } else {
                toast.error("Failed to submit application. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    }
    
    if (!uid) {
        toast.error("You must be logged in to access this page");
        router.push("/");
        return <></>;
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full text-center">
                    <h1 className="text-3xl font-semibold text-green-600 mb-4">Application Submitted!</h1>
                    <p className="text-gray-600 mb-4">
                        Thank you for your interest in becoming a vendor. We've received your application and will review it shortly.
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        You'll receive an email confirmation and we'll notify you of our decision within 3-5 business days.
                    </p>
                    <button 
                        onClick={() => router.push("/vendor-signup")}
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition-colors"
                    >
                        Return to Vendor Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-semibold text-gray-900">Vendor Application</h1>
                    <p className="mt-2 text-gray-600">Fill out the form below to apply to become a vendor</p>
                </div>
                <form className="space-y-6" onSubmit={(e) => handleSubmit(e)}>
                    <Input 
                        label="Vendor Owner Name *" 
                        value={input.name} 
                        onChange={(e) => setInput({ ...input, name: e.target.value })} 
                        placeholder="John Doe" 
                        autoComplete="name" 
                        type="text" 
                        disabled={isSubmitting}
                    />
                    <div className="space-y-2">
                        <Input 
                            label="Store Name *" 
                            value={input.storeName} 
                            onChange={(e) => handleStoreName(e)} 
                            placeholder="John's Store" 
                            disabled={isSubmitting}
                        />
                        <p className="text-sm text-gray-600 pl-1">
                            Store URL: https://forreelflies.com/vendor/{input.storeSlug || "your-store-name"}
                        </p>
                    </div>
                    <Input 
                        label="Store Email *" 
                        value={input.storeEmail} 
                        onChange={(e) => setInput({ ...input, storeEmail: e.target.value })} 
                        placeholder="johndoe@gmail.com" 
                        autoComplete="email" 
                        type="email" 
                        disabled={isSubmitting}
                    />
                    <Input 
                        label="Store Phone *" 
                        value={input.storePhone} 
                        onChange={(e) => setInput({ ...input, storePhone: e.target.value })} 
                        placeholder="123-456-7890" 
                        autoComplete="tel" 
                        type="tel" 
                        disabled={isSubmitting}
                    />
                    <Textarea 
                        label="Store Description * (minimum 50 characters)" 
                        value={input.storeDescription} 
                        onChange={(e) => setInput({ ...input, storeDescription: e.target.value })} 
                        placeholder="Describe your store, products, and what makes you unique..."
                        disabled={isSubmitting}
                    />
                    <Input 
                        label="Store Country *" 
                        value={input.storeCountry} 
                        onChange={(e) => setInput({ ...input, storeCountry: e.target.value })} 
                        autoComplete="country" 
                        type="text" 
                        placeholder="United States"
                        disabled={isSubmitting}
                    />
                    <Input 
                        label="Store Street Address *" 
                        value={input.storeStreetAddress} 
                        onChange={(e) => setInput({ ...input, storeStreetAddress: e.target.value })} 
                        autoComplete="address-line1" 
                        type="text" 
                        placeholder="123 Main Street"
                        disabled={isSubmitting}
                    />
                    <Input 
                        label="Store City *" 
                        value={input.storeCity} 
                        onChange={(e) => setInput({ ...input, storeCity: e.target.value })} 
                        autoComplete="address-level2" 
                        type="text" 
                        placeholder="New York"
                        disabled={isSubmitting}
                    />
                    <Input 
                        label="Store State *" 
                        value={input.storeState} 
                        onChange={(e) => setInput({ ...input, storeState: e.target.value })} 
                        autoComplete="address-level1" 
                        type="text" 
                        placeholder="NY"
                        disabled={isSubmitting}
                    />
                    <Input 
                        label="Store ZIP Code *" 
                        value={input.storeZip} 
                        onChange={(e) => setInput({ ...input, storeZip: e.target.value })} 
                        autoComplete="postal-code" 
                        type="text" 
                        placeholder="12345"
                        disabled={isSubmitting}
                    />
                    <div className="pt-4">
                        <Button 
                            className="w-full" 
                            text={isSubmitting ? "Submitting Application..." : "Submit Application"} 
                            disabled={isSubmitting}
                        />
                        {isSubmitting && (
                            <p className="text-blue-600 text-center text-sm mt-4">
                                Please wait while we process your application...
                            </p>
                        )}
                    </div>
                </form>
            </div>
        </div>
    )
}