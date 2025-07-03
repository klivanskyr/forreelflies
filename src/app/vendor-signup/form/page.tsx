'use client';

import Button from "@/components/buttons/Button";
import { useUser } from "@/contexts/UserContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NoXRedirect from "@/components/NoXRedirect";
import emailjs from "@emailjs/browser";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

export default function Form() {
    const { user, isLoading, refreshUser } = useUser();
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        storeName: "",
        storeDescription: "",
        storePhone: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        country: "US",
    });
    const [step, setStep] = useState<number>(1);
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

    // Check if user should have access to the form
    useEffect(() => {
        if (user) {
            console.log('Form page - User vendorSignUpStatus:', user.vendorSignUpStatus);
            // Only allow access if status is explicitly 'notStarted' or undefined (treating as not started)
            if (user.vendorSignUpStatus && user.vendorSignUpStatus !== 'notStarted') {
                // User has already progressed beyond the initial form stage, redirect to vendor-signup
                console.log('Redirecting user from form to vendor-signup');
                router.push("/vendor-signup");
            }
        }
    }, [user, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-xl text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }
    
    if (!user || !user.uid) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="text-center">
                    <h1 className="text-xl text-red-600 mb-4">Authentication Required</h1>
                    <p className="text-gray-600">You must be logged in to access this page.</p>
                </div>
            </div>
        );
    }

    // Only allow access to users who haven't started the vendor signup process
    if (user.vendorSignUpStatus && user.vendorSignUpStatus !== 'notStarted') {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-xl text-gray-600">Redirecting...</p>
                </div>
            </div>
        );
    }

    const validateStep = (stepNumber: number): boolean => {
        const errors: {[key: string]: string} = {};
        
        switch (stepNumber) {
            case 1:
                if (!formData.name.trim()) {
                    errors.name = "Full name is required";
                }
                if (!formData.email.trim()) {
                    errors.email = "Email is required";
                } else {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(formData.email)) {
                        errors.email = "Please enter a valid email address";
                    }
                }
                break;
            case 2:
                if (!formData.storeName.trim()) {
                    errors.storeName = "Store name is required";
                } else if (formData.storeName.length < 2) {
                    errors.storeName = "Store name must be at least 2 characters long";
                }
                if (!formData.storePhone.trim()) {
                    errors.storePhone = "Store phone is required";
                } else {
                    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
                    if (!phoneRegex.test(formData.storePhone)) {
                        errors.storePhone = "Please enter a valid phone number (at least 10 digits)";
                    }
                }
                if (!formData.storeDescription.trim()) {
                    errors.storeDescription = "Store description is required";
                } else if (formData.storeDescription.length < 50) {
                    errors.storeDescription = "Store description must be at least 50 characters long";
                }
                break;
            case 3:
                if (!formData.address.trim()) {
                    errors.address = "Street address is required";
                }
                if (!formData.city.trim()) {
                    errors.city = "City is required";
                }
                if (!formData.state.trim()) {
                    errors.state = "State is required";
                }
                if (!formData.zip.trim()) {
                    errors.zip = "ZIP code is required";
                } else {
                    const zipRegex = /^\d{5}(-\d{4})?$/;
                    if (!zipRegex.test(formData.zip)) {
                        errors.zip = "Please enter a valid ZIP code (e.g., 12345 or 12345-6789)";
                    }
                }
                break;
        }

        setFieldErrors(errors);
        
        if (Object.keys(errors).length > 0) {
            const errorMessages = Object.values(errors);
            toast.error(`Please fix the following errors: ${errorMessages.join(', ')}`);
            return false;
        }
        
        return true;
    };

    const handleNext = () => {
        if (validateStep(step)) {
            setStep((prev) => prev + 1);
            setFieldErrors({});
        }
    };

    const handleBack = () => {
        setStep((prev) => prev - 1);
        setFieldErrors({});
    };

    const complete = () => {
        return step === 3 && formData.name && formData.email && formData.storeName && formData.storeDescription && formData.storePhone && formData.address && formData.city && formData.state && formData.zip;
    }

    const handleSubmit = async () => {
        console.log('user:', user);
        if (!user || !user.uid) {
            toast.error("You must be logged in to submit a vendor application.");
            return;
        }
        
        if (!validateStep(3)) {
            return;
        }
        
        if (!complete()) {
            toast.error("Please fill out all required fields.");
            return;
        }

        const data = {
            uid: user.uid,
            name: formData.name,
            storeName: formData.storeName,
            storeSlug: formData.storeName.toLowerCase().replace(/\s+/g, '-'),
            storeEmail: formData.email,
            storePhone: formData.storePhone,
            storeDescription: formData.storeDescription,
            storeStreetAddress: formData.address,
            storeCity: formData.city,
            storeZip: formData.zip,
            storeCountry: formData.country,
            storeState: formData.state,
            approveLink: process.env.NEXT_PUBLIC_APPROVE_VENDOR_REQUEST_URL,
        }

        console.log('Submitting vendor request:', data);

        setLoading(true);
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/request-vendor`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
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

            console.log("Vendor request submitted successfully, verifying database update...");
            
            // Verify that the database was actually updated before proceeding
            let retries = 0;
            const maxRetries = 10;
            let dbUpdated = false;
            
            while (retries < maxRetries && !dbUpdated) {
                await new Promise(resolve => setTimeout(resolve, 500));
                
                try {
                    // Check the user document directly in Firebase
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    const userData = userDoc.data();
                    
                    console.log(`Retry ${retries + 1}: Database vendor status:`, userData?.vendorSignUpStatus);
                    
                    if (userData?.vendorSignUpStatus === 'submittedApprovalForm') {
                        dbUpdated = true;
                        console.log("Database successfully updated!");
                    } else {
                        retries++;
                        console.log(`Database not yet updated, retrying... (${retries}/${maxRetries})`);
                    }
                } catch (error) {
                    console.error("Error checking database:", error);
                    retries++;
                }
            }
            
            if (!dbUpdated) {
                console.warn("Database may not be fully updated, but proceeding...");
            }
            
            // Now refresh the user session
            console.log("Refreshing user session...");
            await refreshUser();
            
            // Send confirmation email
            try {
                await emailjs.send("service_67miukk", "template_2je91rh", {
                    ...data,
                }, "gWJ3uFncMXWrKUMgw");
                console.log("Confirmation email sent successfully");
            } catch (emailError) {
                console.error("Failed to send confirmation email:", emailError);
                // Don't block the redirect if email fails
            }
            
            // Refresh session one more time before redirect to ensure we have the latest data
            await refreshUser();
            
            toast.success("Vendor application submitted successfully! We'll review your application and get back to you soon.");
            console.log("Redirecting to vendor-signup page...");
            router.push("/vendor-signup");

        } catch (networkError) {
            console.error("Network error submitting vendor application:", networkError);
            
            if (networkError instanceof TypeError && networkError.message.includes("fetch")) {
                toast.error("Connection error. Please check your internet connection and try again.");
            } else {
                toast.error("Failed to submit application. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    return (
        <NoXRedirect x={user} redirectUrl="/?login=true">
            <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    {step === 1 && (
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-8">Step 1: Personal Information</h2>
                            <div className="space-y-4">
                                <div>
                                    <input 
                                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                                        name="name" 
                                        placeholder="Full Name *" 
                                        value={formData.name} 
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                    {fieldErrors.name && <p className="text-red-500 text-sm mt-1 text-left">{fieldErrors.name}</p>}
                                </div>
                                <div>
                                    <input 
                                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                                        name="email" 
                                        type="email"
                                        placeholder="Email Address *" 
                                        value={formData.email} 
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                    {fieldErrors.email && <p className="text-red-500 text-sm mt-1 text-left">{fieldErrors.email}</p>}
                                </div>
                            </div>
                            <div className="flex justify-between mt-8">
                                <Button text="Back" onClick={handleBack} disabled={step === 1 || loading} className="mr-2 opacity-50 cursor-not-allowed" />
                                <Button text="Next" onClick={handleNext} disabled={loading} />
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-8">Step 2: Store Information</h2>
                            <div className="space-y-4">
                                <div>
                                    <input 
                                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.storeName ? 'border-red-500' : 'border-gray-300'}`}
                                        name="storeName" 
                                        placeholder="Store Name *" 
                                        value={formData.storeName} 
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                    {fieldErrors.storeName && <p className="text-red-500 text-sm mt-1 text-left">{fieldErrors.storeName}</p>}
                                </div>
                                <div>
                                    <input 
                                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.storePhone ? 'border-red-500' : 'border-gray-300'}`}
                                        name="storePhone" 
                                        type="tel"
                                        placeholder="Store Phone Number *" 
                                        value={formData.storePhone} 
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                    {fieldErrors.storePhone && <p className="text-red-500 text-sm mt-1 text-left">{fieldErrors.storePhone}</p>}
                                </div>
                                <div>
                                    <textarea 
                                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[120px] resize-vertical ${fieldErrors.storeDescription ? 'border-red-500' : 'border-gray-300'}`}
                                        name="storeDescription" 
                                        placeholder="Store Description * (minimum 50 characters) - Describe your store, products, and what makes you unique..." 
                                        value={formData.storeDescription} 
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                    <p className="text-xs text-gray-500 mt-1 text-left">{formData.storeDescription.length}/50 minimum characters</p>
                                    {fieldErrors.storeDescription && <p className="text-red-500 text-sm mt-1 text-left">{fieldErrors.storeDescription}</p>}
                                </div>
                            </div>
                            <div className="flex justify-between mt-8">
                                <Button text="Back" onClick={handleBack} disabled={loading} />
                                <Button text="Next" onClick={handleNext} disabled={loading} />
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-8">Step 3: Address Information</h2>
                            <div className="space-y-4">
                                <div>
                                    <input 
                                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.address ? 'border-red-500' : 'border-gray-300'}`}
                                        name="address" 
                                        placeholder="Street Address *" 
                                        value={formData.address} 
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                    {fieldErrors.address && <p className="text-red-500 text-sm mt-1 text-left">{fieldErrors.address}</p>}
                                </div>
                                <div>
                                    <input 
                                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.city ? 'border-red-500' : 'border-gray-300'}`}
                                        name="city" 
                                        placeholder="City *" 
                                        value={formData.city} 
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                    {fieldErrors.city && <p className="text-red-500 text-sm mt-1 text-left">{fieldErrors.city}</p>}
                                </div>
                                <div>
                                    <input 
                                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.state ? 'border-red-500' : 'border-gray-300'}`}
                                        name="state" 
                                        placeholder="State *" 
                                        value={formData.state} 
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                    {fieldErrors.state && <p className="text-red-500 text-sm mt-1 text-left">{fieldErrors.state}</p>}
                                </div>
                                <div>
                                    <input 
                                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.zip ? 'border-red-500' : 'border-gray-300'}`}
                                        name="zip" 
                                        placeholder="ZIP Code *" 
                                        value={formData.zip} 
                                        onChange={handleChange}
                                        disabled={loading}
                                    />
                                    {fieldErrors.zip && <p className="text-red-500 text-sm mt-1 text-left">{fieldErrors.zip}</p>}
                                </div>
                            </div>
                            <div className="flex justify-between mt-8">
                                <Button text="Back" onClick={handleBack} disabled={loading} />
                                <Button 
                                    text={loading ? "Submitting..." : "Submit Application"}
                                    className={`flex-1 ml-4 ${complete() ? "" : "!bg-gray-400 cursor-not-allowed"}`}
                                    onClick={handleSubmit}
                                    disabled={!complete() || loading}
                                    loading={loading}
                                />
                            </div>
                            {loading && (
                                <p className="text-blue-600 text-center text-sm mt-4">
                                    Please wait while we process your application...
                                </p>
                            )}
                        </div>
                    )}

                    {/* Progress indicator */}
                    <div className="flex justify-center mt-8">
                        <div className="flex space-x-2">
                            {[1, 2, 3].map((stepNum) => (
                                <div
                                    key={stepNum}
                                    className={`w-3 h-3 rounded-full ${
                                        stepNum === step 
                                            ? 'bg-blue-600' 
                                            : stepNum < step 
                                                ? 'bg-green-500' 
                                                : 'bg-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </NoXRedirect>
    );
}