'use client';

import Button from "@/components/buttons/Button";
import NoXRedirect from "@/components/NoXRedirect";
import { useUser } from "@/contexts/UserContext";
import { DbUser } from "@/lib/firebase-admin";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import emailjs from "@emailjs/browser";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const dynamic = 'force-dynamic';

function VendorSignUpContent() {
    const { user, refreshUser } = useUser();
    const router = useRouter();
    
    // Form state for the vendor application
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        vendorName: "",
        description: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        country: "US",
    });
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

    const validateForm = (): boolean => {
        const errors: {[key: string]: string} = {};
        
        if (!formData.name.trim()) {
            errors.name = "Name is required";
        }
        if (!formData.email.trim()) {
            errors.email = "Email is required";
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(formData.email)) {
                errors.email = "Please enter a valid email address";
            }
        }
        if (!formData.vendorName.trim()) {
            errors.vendorName = "Vendor name is required";
        }
        if (!formData.phone.trim()) {
            errors.phone = "Phone number is required";
        }
        if (!formData.description.trim()) {
            errors.description = "Description is required";
        }
        if (!formData.address.trim()) {
            errors.address = "Address is required";
        }
        if (!formData.city.trim()) {
            errors.city = "City is required";
        }
        if (!formData.state.trim()) {
            errors.state = "State is required";
        }
        if (!formData.zip.trim()) {
            errors.zip = "ZIP code is required";
        }

        setFieldErrors(errors);
        
        if (Object.keys(errors).length > 0) {
            const errorMessages = Object.values(errors);
            toast.error(`Please fix the following errors: ${errorMessages.join(', ')}`);
            return false;
        }
        
        return true;
    };

    const handleSubmitForm = async () => {
        if (!user || !user.uid) {
            toast.error("You must be logged in to submit a vendor application.");
            return;
        }
        
        if (!validateForm()) {
            return;
        }

        const data = {
            uid: user.uid,
            name: formData.name,
            storeName: formData.vendorName,
            storeSlug: formData.vendorName.toLowerCase().replace(/\s+/g, '-'),
            storeEmail: formData.email,
            storePhone: formData.phone,
            storeDescription: formData.description,
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
            
            let retries = 0;
            const maxRetries = 10;
            let dbUpdated = false;
            
            while (retries < maxRetries && !dbUpdated) {
                await new Promise(resolve => setTimeout(resolve, 500));
                
                try {
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
            
            await refreshUser();
            
            try {
                await emailjs.send("service_67miukk", "template_2je91rh", {
                    ...data,
                }, "gWJ3uFncMXWrKUMgw");
                console.log("Confirmation email sent successfully");
            } catch (emailError) {
                console.error("Failed to send confirmation email:", emailError);
            }
            
            await refreshUser();
            
            toast.success("Vendor application submitted successfully! We'll review your application and get back to you soon.");
            setShowForm(false);
            setFormData({
                name: "",
                email: "",
                vendorName: "",
                description: "",
                phone: "",
                address: "",
                city: "",
                state: "",
                zip: "",
                country: "US",
            });

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
        
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    function DisplayVendorStatusMessage({ user }: { user: DbUser }) {
        console.log('Vendor signup page - User vendorSignUpStatus:', user.vendorSignUpStatus);
        
        const status = user.vendorSignUpStatus;
        
        switch (status) {
            case "notStarted":
                return (
                    <div className="w-full h-full flex flex-col flex-1 justify-center items-center text-center">
                        <h1 className="text-3xl text-gray-800 font-bold mb-8">Become a Vendor</h1>
                        <h2 className="text-xl font-semibold mb-2">Start selling your fly fishing products on ForReelFlies</h2>
                        <p className="text-sm text-gray-600 mb-8">Join our community of passionate fly tiers and anglers.</p>
                        <Button className="mt-3 w-[400px]" text="Start Application" onClick={() => setShowForm(true)}/>
                    </div>
                )

            case "submittedApprovalForm":
                return (
                    <div className="w-full h-full flex flex-col flex-1 justify-center items-center text-center">
                        <h1 className="text-3xl text-gray-800 font-bold mb-8">Application Submitted!</h1>
                        <h2 className="text-xl font-semibold mb-2">Your application is under review.</h2>
                        <p className="text-sm text-gray-600 mb-4">We will review your application and get back to you shortly.</p>
                        <p className="text-sm text-gray-600 mb-8">Thank you for your patience.</p>
                        
                        <div className="space-y-4">
                            <Button 
                                text="Refresh Page" 
                                onClick={() => window.location.reload()}
                                className="bg-blue-600 hover:bg-blue-700"
                            />
                            <p className="text-xs text-gray-500">Click to check for status updates</p>
                        </div>
                    </div>
                )

            case "vendorActive":
                return (
                    <div className="w-full h-full flex flex-col flex-1 justify-center items-center text-center">
                        <h1 className="text-3xl text-green-600 font-bold mb-8">Congratulations! Your application has been approved!</h1>
                        <h2 className="text-xl font-semibold mb-2">Your vendor account is now active.</h2>
                        <p className="text-sm text-gray-600 mb-4">You can start managing your products and selling on our platform.</p>
                        
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-[600px] mb-8">
                            <p className="text-sm text-blue-800 font-semibold mb-2">What you can do now:</p>
                            <ul className="text-sm text-blue-700 text-left list-disc list-inside space-y-1">
                                <li>Add and manage your products</li>
                                <li>Receive orders from customers</li>
                                <li>Track your sales and earnings</li>
                                <li>Set up payment processing (required for withdrawals)</li>
                            </ul>
                        </div>

                        <Button 
                            className="mt-3 w-[400px]" 
                            text="Go to Store Manager" 
                            onClick={() => router.push("/store-manager")}
                        />
                    </div>
                )

            case "approvalFormRejected":
                return (
                    <div className="w-full h-full flex flex-col flex-1 justify-center items-center text-center">
                        <h1 className="text-3xl text-red-600 font-bold mb-8">Application Not Approved</h1>
                        <h2 className="text-xl font-semibold mb-2">We're sorry, but your vendor application was not approved at this time.</h2>
                        <p className="text-sm text-gray-600 mb-4">If you believe this was a mistake or would like to apply again, please contact our support team.</p>
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-w-[600px]">
                            <p className="text-sm text-red-800">
                                For questions about your application status, please contact us at support@forreelflies.com
                            </p>
                        </div>
                    </div>
                )

            case "onboardingCompleted":
                return (
                    <div className="w-full h-full flex flex-col flex-1 justify-center items-center text-center">
                        <h1 className="text-3xl text-green-600 font-bold mb-8">Welcome to ForReelFlies!</h1>
                        <h2 className="text-xl font-semibold mb-2">Your vendor account is fully set up and ready to use.</h2>
                        <p className="text-sm text-gray-600 mb-8">You can now start managing your products and selling on our platform.</p>
                        <Button 
                            className="mt-3 w-[400px]" 
                            text="Go to Store Manager" 
                            onClick={() => router.push("/store-manager")}
                        />
                    </div>
                )
            
            default:
                console.log('Unknown or undefined vendorSignUpStatus, treating as notStarted');
                return (
                    <div className="w-full h-full flex flex-col flex-1 justify-center items-center text-center">
                        <h1 className="text-3xl text-gray-800 font-bold mb-8">Become a Vendor</h1>
                        <h2 className="text-xl font-semibold mb-2">Start selling your fly fishing products on ForReelFlies</h2>
                        <p className="text-sm text-gray-600 mb-8">Join our community of passionate fly tiers and anglers.</p>
                        <Button className="mt-3 w-[400px]" text="Start Application" onClick={() => setShowForm(true)}/>
                    </div>
                )
        }   
    }

    if (!user) {
        console.log('Vendor signup page - User is null/undefined');
        return <></>;
    }
    
    console.log('Vendor signup page - User exists, vendorSignUpStatus:', user.vendorSignUpStatus);

    // Show the form if user clicked to start application
    if (showForm) {
        return (
            <NoXRedirect x={user} redirectUrl="/?login=true">
                <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl w-full space-y-8">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Vendor Application</h1>
                            <p className="text-gray-600">Tell us about yourself and your products</p>
                        </div>

                        <div className="bg-white rounded-lg shadow-lg p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Personal Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                                    
                                    <div>
                                        <input 
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                                            name="name" 
                                            placeholder="Full Name *" 
                                            value={formData.name} 
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                        {fieldErrors.name && <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>}
                                    </div>
                                    
                                    <div>
                                        <input 
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                                            name="email" 
                                            type="email"
                                            placeholder="Email Address *" 
                                            value={formData.email} 
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                        {fieldErrors.email && <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>}
                                    </div>
                                    
                                    <div>
                                        <input 
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${fieldErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                                            name="phone" 
                                            type="tel"
                                            placeholder="Phone Number *" 
                                            value={formData.phone} 
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                        {fieldErrors.phone && <p className="text-red-500 text-sm mt-1">{fieldErrors.phone}</p>}
                                    </div>
                                </div>

                                {/* Vendor Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Vendor Information</h3>
                                    
                                    <div>
                                        <input 
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${fieldErrors.vendorName ? 'border-red-500' : 'border-gray-300'}`}
                                            name="vendorName" 
                                            placeholder="Vendor Name *" 
                                            value={formData.vendorName} 
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                        {fieldErrors.vendorName && <p className="text-red-500 text-sm mt-1">{fieldErrors.vendorName}</p>}
                                    </div>
                                    
                                    <div>
                                        <textarea 
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[100px] resize-vertical ${fieldErrors.description ? 'border-red-500' : 'border-gray-300'}`}
                                            name="description" 
                                            placeholder="Tell us about your products and experience *" 
                                            value={formData.description} 
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                        {fieldErrors.description && <p className="text-red-500 text-sm mt-1">{fieldErrors.description}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Address Information */}
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Address Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <input 
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${fieldErrors.address ? 'border-red-500' : 'border-gray-300'}`}
                                            name="address" 
                                            placeholder="Street Address *" 
                                            value={formData.address} 
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                        {fieldErrors.address && <p className="text-red-500 text-sm mt-1">{fieldErrors.address}</p>}
                                    </div>
                                    
                                    <div>
                                        <input 
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${fieldErrors.city ? 'border-red-500' : 'border-gray-300'}`}
                                            name="city" 
                                            placeholder="City *" 
                                            value={formData.city} 
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                        {fieldErrors.city && <p className="text-red-500 text-sm mt-1">{fieldErrors.city}</p>}
                                    </div>
                                    
                                    <div>
                                        <input 
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${fieldErrors.state ? 'border-red-500' : 'border-gray-300'}`}
                                            name="state" 
                                            placeholder="State *" 
                                            value={formData.state} 
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                        {fieldErrors.state && <p className="text-red-500 text-sm mt-1">{fieldErrors.state}</p>}
                                    </div>
                                    
                                    <div>
                                        <input 
                                            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${fieldErrors.zip ? 'border-red-500' : 'border-gray-300'}`}
                                            name="zip" 
                                            placeholder="ZIP Code *" 
                                            value={formData.zip} 
                                            onChange={handleChange}
                                            disabled={loading}
                                        />
                                        {fieldErrors.zip && <p className="text-red-500 text-sm mt-1">{fieldErrors.zip}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="mt-8 flex justify-between items-center">
                                <Button 
                                    text="Back" 
                                    onClick={() => setShowForm(false)} 
                                    disabled={loading}
                                    className="bg-gray-500 hover:bg-gray-600"
                                />
                                <Button 
                                    text={loading ? "Submitting..." : "Submit Application"}
                                    onClick={handleSubmitForm}
                                    disabled={loading}
                                    loading={loading}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </NoXRedirect>
        );
    }

    return (
        <NoXRedirect x={user} redirectUrl="/?login=true">
            <div className="my-20">
                <DisplayVendorStatusMessage user={user} />
            </div>
        </NoXRedirect>
    )
}

export default function Page() {
    return (
        <Suspense fallback={
            <div className="w-full h-full flex flex-col flex-1 justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
            </div>
        }>
            <VendorSignUpContent />
        </Suspense>
    );
}