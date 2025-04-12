'use client';

import Button from "@/Components/buttons/Button";
import Input from "@/Components/inputs/Input";
import { useState } from "react";

type InputProps = {
    adminEmail: string;
    adminPassword: string;
    uid: string;
}

export default function ApproveVendorForm() {
    const [input, setInput] = useState<InputProps>({ adminEmail: "", adminPassword: "", uid: ""});
    const [submitted, setSubmitted] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!input.adminEmail || !input.adminPassword || !input.uid) {
            // alert("Please fill out all fields");
            return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vendor/approve-vendor`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(input)
        });

        if (!response.ok) {
            // alert("Error submitting form");
            return;
        }
        
        setSubmitted(true);
    }

    return (
        <div className="flex flex-col items-center gap-4 p-8 w-full mb-12 mt-2">
            <h1 className="text-3xl font-semibold">Vendor Approval Form</h1>
            <form className="flex flex-col w-full max-w-[750px] gap-2 mb-2" onSubmit={(e) => handleSubmit(e)}>
                <Input label="Admin Email" type="email" value={input.adminEmail} onChange={(e) => setInput({ ...input, adminEmail: e.target.value })} />
                <Input label="Admin Password" type="password" value={input.adminPassword} onChange={(e) => setInput({ ...input, adminPassword: e.target.value })} />
                <Input label="User ID" type="text" value={input.uid} onChange={(e) => setInput({ ...input, uid: e.target.value })} />
                <Button className="mt-2" text="Submit" />
                {submitted ? <p className="text-green-500 text-center">Submitted!</p> : <></>}
            </form>
        </div>
    )
}