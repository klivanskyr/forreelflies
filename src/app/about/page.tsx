"use client";
import { useEffect, useState } from "react";
import placeholder from "@/../public/placeholder.png";
import Slide from "@/components/Slider/Slide";
import Link from "next/link";
import { ButtonLink } from "@/components/Links";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function Page() {
    const [aboutImage, setAboutImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const q = query(collection(db, "adminImageAssignments"), where("section", "==", "about-us"));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                // Use the most recent image if multiple
                const sorted = snapshot.docs
                    .map(doc => doc.data())
                    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setAboutImage(sorted[0].imageUrl);
            }
            setLoading(false);
        })();
    }, []);

    return (
        <div className="flex flex-col mb-2">
            <Slide className="mb-2" backgroundSrc={aboutImage || placeholder.src}>
                <div className="h-[500px] 2xl:h-[750px] flex flex-col px-16 py-32 w-1/2 justify-center">
                    <div className="flex flex-col gap-8">
                        <h1 className="text-6xl font-semibold">ABOUT US</h1>
                        <p className="text-lg">We grew up Monmouth County, New Jersey and have been fishing since the age of 2. Throughout the years our fishing interests have shifted from bass on light spinning gear on our neighbors dock, to permit on fly in the Florida Keys. Sneaking in every opportunity we can to tie flies, cast to fish, or watch videos to inspire our next trip, we balance our college education and our passion. </p>
                    </div>
                </div>
            </Slide>
            
            <div className="grid grid-cols-2 p-8">
                <div className="flex flex-col gap-8 2xl:gap-24">
                    <div className="flex flex-col gap-4 2xl:gap-8">
                        <p className="text-xl 2xl:text-2xl">Our goal at ForReelFlies is to bridge the gap between those who love to tie flies and those who love to use them. We want to connect our amazing fly tiers with you to help fool that fish you have always wanted to catch. </p>
                        <p className="text-xl 2xl:text-2xl">Our blog is a culmination of your catches on flies purchased from one of our vendors. Be sure to send us pictures for us to post!</p>
                        <p className="text-xl 2xl:text-2xl">We take great care in finding trusted vendors who share our dedication to quality and performance.</p>
                        <p className="text-xl 2xl:text-2xl">Join us and <Link href="/"><span className="text-greenPrimary font-medium">Become a Vendor</span></Link> and experience the thrill of connecting with your clients to best meet their needs. </p>
                    </div>
                    <div className="flex flex-col gap-5">
                        <h3 className="text-3xl 2xl:text-4xl">Sell your product with us!</h3>
                        <ButtonLink className="w-[200px] 2xl:w-[300px] 2xl:h-[60px] 2xl:text-xl p-2 rounded-lg" href="/" text="Become a Vendor" />
                    </div>
                </div>
            </div>
        </div>
    )
}