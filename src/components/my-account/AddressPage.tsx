'use client';

import { useState } from "react";
import Modal from "../modal/Modal";
import Button from "../buttons/Button";
import Input from "../inputs/Input";
import { useUser } from "@/contexts/UserContext";

type InputProps = {
    streetAddress: string,
    city: string,
    state: string,
    zipCode: string,
    country: string
}

export default function AddressPage() {
    const { user } = useUser();
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState<InputProps>({
        streetAddress: user?.streetAddress || "",
        city: user?.city || "",
        state: user?.state || "",
        zipCode: user?.zipCode || "",
        country: user?.country || ""
    });

    if (!user) return <></>;

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                uid: user.uid,
                ...input
            })
        })
        if (!response.ok) {
            console.log("error", response.statusText);
            return;
        }

        const data = await response.json();
        console.log(data);
        setOpen(false);
    }

    return (
        <>
            <div className="p-4 w-full h-full flex flex-col items-center justify-center">
                <div className="flex flex-col items-center justify-center gap-4 p-4 w-3/4">
                    <Button className="w-full text-xl" text="Add or Update Address" onClick={() => setOpen(true)}/>
                    <div className="text-lg flex flex-col">
                        {user.streetAddress && <h1>Street Address: {user.streetAddress}</h1>}
                        {user.city && <h1>City: {user.city}</h1>}
                        {user.state && <h1>State: {user.state}</h1>}
                        {user.zipCode && <h1>Zipcode: {user.zipCode}</h1>}
                        {user.country && <h1>Country: {user.country}</h1>}
                    </div>
                </div>
            </div>
            <Modal className="flex flex-col items-center justify-center gap-4 w-[50dvw] h-[50dvh] rounded-md" open={open} setOpen={setOpen} >
                <form className="flex flex-col w-[75%]" onSubmit={handleFormSubmit}>
                    <Input label="Street Address" value={input.streetAddress} onChange={(e) => setInput({ ...input, streetAddress: e.target.value })} />
                    <Input label="City" value={input.city} onChange={(e) => setInput({ ...input, city: e.target.value })} />
                    <Input label="State" value={input.state} onChange={(e) => setInput({ ...input, state: e.target.value })} />
                    <Input label="Zip Code" value={input.zipCode} onChange={(e) => setInput({ ...input, zipCode: e.target.value })} />
                    <Input label="Country" value={input.country} onChange={(e) => setInput({ ...input, country: e.target.value })} />
                    <Button className="mt-1" text="Save" type="submit" />
                </form>
            </Modal>
        </>
    )
}