'use client';

import { calculateShipping } from "@/helpers/calculateShipping";
import Button from "./Button";
import { DbUser } from "@/lib/firebase-admin";
import { Product, Rate } from "@/app/types/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CalculateShippingButton({ user, products }: { user: DbUser, products: Product[] }) {
    const router = useRouter();
    const [rates, setRates] = useState<Rate[]>([]);
    const [loading, setLoading] = useState(false);

    if (!user.streetAddress || !user.city || !user.state || !user.zipCode || !user.country) {
        return <Button text="Add address to calculate shipping" className="h-10" onClick={() => router.push("/my-account/edit-address")}/>;
    }

    const handleClick = async () => {
        setLoading(true);
        const [rates, err] = await calculateShipping(user, products)
        if (err) {
            console.log(err);
            setLoading(false);
            return;
        }
        setRates(rates);
        setLoading(false);
    }

    return (
        <>
            {(rates.length == 0 && !loading) && <Button onClick={() => handleClick()} className="h-10" text="Calculating Shipping Button" />}
            {loading && <div>Loading...</div>}
            {rates && <div>{rates.map((rate, i) => <div key={i}>{`$${rate.amount}`}</div>)}</div>}
        </>
    )
}