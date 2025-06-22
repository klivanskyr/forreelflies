'use client';

import Button from "@/components/buttons/Button";
import { useUser } from "@/contexts/UserContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import NoXRedirect from "@/components/NoXRedirect";
import emailjs from "@emailjs/browser";

export default function Form() {
    const { user, isLoading } = useUser();
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

    if (isLoading) {
        return <div className="flex justify-center items-center h-96 text-xl">Loading user...</div>;
    }
    if (!user || !user.uid) {
        return <div className="flex justify-center items-center h-96 text-xl text-red-600">You must be logged in to access this page.</div>;
    }

    const handleNext = () => {
        setStep((prev) => prev + 1);
    };

    const handleBack = () => {
        setStep((prev) => prev - 1);
    };

    const complete = () => {
        return step === 3 && formData.name && formData.email && formData.storeName && formData.storeDescription && formData.storePhone && formData.address && formData.city && formData.state && formData.zip;
    }

    const handleSubmit = async () => {
        console.log('user:', user);
        if (!user || !user.uid) {
            alert("You must be logged in to submit a vendor application.");
            return;
        }
        if (!complete()) {
            alert("Please fill out all fields.");
            return;
        }

        // Email regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Validate email
        if (!emailRegex.test(formData.email)) {
            console.error("Invalid email format");
            return;
        }

        // validate phone number with only digits and optional country code
        const phoneRegex = /^\+?\d{10,15}$/; // Allows optional '+' and 10-15 digits
        if (!phoneRegex.test(formData.storePhone)) {
            console.error("Invalid phone number format");
            return;
        }
        // Validate zip code (assuming US format)
        const zipRegex = /^\d{5}(-\d{4})?$/; // Allows 5 digits or 5 digits + 4 digits
        if (!zipRegex.test(formData.zip)) {
            console.error("Invalid zip code format");
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

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/request-vendor`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            console.error("Failed to submit vendor application");
            return;
        }

        // time out for 5 seconds to allow the backend to process the request
        setLoading(true);
        await new Promise(resolve => setTimeout(resolve, 5000));

        await emailjs.send("service_67miukk", "template_2je91rh", {
            ...data,
        }, "gWJ3uFncMXWrKUMgw");
        
        router.push("/vendor-signup");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <NoXRedirect x={user} redirectUrl="/?login=true">
            {step === 1 && (
                <div className="w-3/5 h-full flex flex-col flex-1 justify-center items-center text-center">
                    <h2 className="text-xl font-semibold mb-4">Step 1: Personal Info</h2>
                    <input className="w-full mb-2 p-2 border" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} />
                    <input className="w-full mb-2 p-2 border" name="email" placeholder="Email" value={formData.email} onChange={handleChange} />
                    <div className="w-full flex justify-between ">
                        <Button text="Back" onClick={handleBack} disabled={step === 1} className="mr-2" />
                        <Button text="Next" onClick={handleNext} />
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="w-3/5 h-full flex flex-col flex-1 justify-center items-center text-center">
                    <h2 className="text-xl font-semibold mb-4">Step 2: Store Info</h2>
                    <input className="w-full mb-2 p-2 border" name="storeName" placeholder="Store Name" value={formData.storeName} onChange={handleChange} />
                    <input className="w-full mb-2 p-2 border" name="storePhone" placeholder="Store Phone" value={formData.storePhone} onChange={handleChange} />
                    <textarea className="w-full mb-2 p-2 border" name="storeDescription" placeholder="Store Description" value={formData.storeDescription} onChange={handleChange} />
                    <div className="flex justify-between w-full">
                        <Button text="Back" onClick={handleBack} />
                        <Button text="Next" onClick={handleNext} />
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="w-3/5 h-full flex flex-col flex-1 justify-center items-center text-center">
                    <h2 className="text-xl font-semibold mb-4">Step 3: Address Info</h2>
                    <input className="w-full mb-2 p-2 border" name="address" placeholder="Street Address" value={formData.address} onChange={handleChange} />
                    <input className="w-full mb-2 p-2 border" name="city" placeholder="City" value={formData.city} onChange={handleChange} />
                    <input className="w-full mb-2 p-2 border" name="state" placeholder="State" value={formData.state} onChange={handleChange} />
                    <input className="w-full mb-2 p-2 border" name="zip" placeholder="Zip" value={formData.zip} onChange={handleChange} />
                    <div className="flex justify-between w-full">
                        <Button text="Back" onClick={handleBack} />
                        <Button 
                            text="Submit"
                            className={`w-full ${complete() ? "" : "!bg-gray-400"}`}
                            onClick={handleSubmit}
                            disabled={!complete()}
                            loading={loading}
                        />
                    </div>
                </div>
            )}
        </NoXRedirect>
    );
}