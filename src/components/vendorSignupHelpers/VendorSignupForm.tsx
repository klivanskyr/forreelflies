'use client';

import Button from "@/Components/buttons/Button";
import Input from "@/Components/inputs/Input";
import { useState } from "react";
import Textarea from "../Textarea";
import { useRouter } from "next/navigation";
import emailjs from "@emailjs/browser";

export default function VendorSignupForm({ uid }: { uid: string | null }) {
    const router = useRouter();
    const [submitted, setSubmitted] = useState(false);
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.name || !input.storeName || !input.storeEmail || !input.storePhone || !input.storeDescription || !input.storeStreetAddress || !input.storeCity || !input.storeZip || !input.storeCountry || !input.storeState) {
            // alert("Please fill out all fields");
            return;
        }
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
                // alert("Error submitting form");
                return;
            }

            await emailjs.send("service_67miukk", "template_2je91rh", {
                uid,
                ...input
            }, "gWJ3uFncMXWrKUMgw");

            setSubmitted(true);
        } catch (error) {
            console.error(error);
        }
    }
    
    if (!uid) {
        // alert("You must be logged in to access this page");
        router.push("/");
        return <></>;
    }
    return (
        <div className="flex flex-col items-center gap-4 p-8 w-full mb-12 mt-2">
            <h1 className="text-3xl font-semibold">Vendor Signup</h1>
            <form className="flex flex-col w-full max-w-[750px] gap-2 mb-2" onSubmit={(e) => handleSubmit(e)}>
                <Input label="Vender Owner Name" value={input.name} onChange={(e) => setInput({ ...input, name: e.target.value })} placeholder="John Doe" autoComplete="name" type="text" />
                <div className="flex flex-col">
                    <Input label="Store Name" value={input.storeName} onChange={(e) => handleStoreName(e)} placeholder="John's Store" />
                    <p className="text-sm indent-2">https://forreelflies.com/vendor/{input.storeSlug}</p>
                </div>
                <Input label="Store Email" value={input.storeEmail} onChange={(e) => setInput({ ...input, storeEmail: e.target.value })} placeholder="johndoe@gmail.com" autoComplete="email" type="text" />
                <Input label="Store Phone" value={input.storePhone} onChange={(e) => setInput({ ...input, storePhone: e.target.value })} placeholder="123-456-7890" autoComplete="tel" type="tel" />
                <Textarea label="Store Description" value={input.storeDescription} onChange={(e) => setInput({ ...input, storeDescription: e.target.value })} />
                <Input label="Store Country" value={input.storeCountry} onChange={(e) => setInput({ ...input, storeCountry: e.target.value })} autoComplete="country" type="text" />
                <Input label="Store Street Address" value={input.storeStreetAddress} onChange={(e) => setInput({ ...input, storeStreetAddress: e.target.value })} autoComplete="address-line1" type="text" />
                <Input label="Store City" value={input.storeCity} onChange={(e) => setInput({ ...input, storeCity: e.target.value })} autoComplete="address-level2" type="text" />
                <Input label="Store State" value={input.storeState} onChange={(e) => setInput({ ...input, storeState: e.target.value })} autoComplete="address-level1" type="text" />
                <Input label="Store Zip" value={input.storeZip} onChange={(e) => setInput({ ...input, storeZip: e.target.value })} autoComplete="postal-code" type="text" />
                <Button className="mt-2" text="Submit" />
                {submitted ? <p className="text-green-500 text-center">Submitted!</p> : <></>}
            </form>
        </div>
    )
}