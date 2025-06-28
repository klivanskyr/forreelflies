'use client';

import { calculateShipping } from "@/helpers/calculateShipping";
import Button from "./Button";
import { DbUser } from "@/lib/firebase-admin";
import { Product, Rate } from "@/app/types/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function CalculateShippingButton({ user, products }: { user: DbUser, products: Product[] }) {
    const router = useRouter();
    const [rates, setRates] = useState<Rate[]>([]);
    const [loading, setLoading] = useState(false);

    if (!user.streetAddress || !user.city || !user.state || !user.zipCode || !user.country) {
        return <Button text="Add address to calculate shipping" className="h-10" onClick={() => router.push("/my-account/edit-address")}/>;
    }

    const handleClick = async () => {
        setLoading(true);
        
        try {
            const [rates, err] = await calculateShipping(user, products);
            
            if (err) {
                console.log(err);
                toast.error(`Unable to calculate shipping: ${err}`);
                return;
            }
            
            if (rates.length === 0) {
                toast.error("No shipping options available for your location.");
                return;
            }
            
            setRates(rates);
            console.log("Shipping rates calculated successfully!");
        } catch (error) {
            console.error("Error calculating shipping:", error);
            toast.error("Failed to calculate shipping. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            {(rates.length == 0 && !loading) && <Button onClick={() => handleClick()} className="h-10" text="Calculate Shipping" />}
            {loading && <div>Loading...</div>}
            {rates && <div>{rates.map((rate, i) => <div key={i}>{`$${rate.amount}`}</div>)}</div>}
        </>
    )
}