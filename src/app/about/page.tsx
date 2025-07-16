"use client";
import { useEffect, useState } from "react";
import placeholder from "@/../public/placeholder.png";
import Slide from "@/components/Slider/Slide";
import Link from "next/link";
import { ButtonLink } from "@/components/Links";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { FaFish, FaUsers, FaStore, FaHeart } from "react-icons/fa";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function Page() {
    const [aboutImage, setAboutImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { user } = useUser();
    const router = useRouter();

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

    const handleBecomeVendorClick = () => {
        if (!user) {
            toast.error("Please sign in to become a vendor");
            router.push("?login=true");
            return;
        }
        router.push("/vendor-signup");
    };

    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <Slide className="mb-0" backgroundSrc={aboutImage || placeholder.src}>
                <div className="h-[500px] 2xl:h-[750px] flex flex-col px-6 md:px-16 py-32 w-full md:w-1/2 justify-center">
                    <div className="flex flex-col gap-8">
                        <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg">ABOUT US</h1>
                        <p className="text-lg md:text-xl text-white drop-shadow-md leading-relaxed bg-black bg-opacity-30 p-6 rounded-lg backdrop-blur-sm">
                            We grew up Monmouth County, New Jersey and have been fishing since the age of 2. Throughout the years our fishing interests have shifted from bass on light spinning gear on our neighbors dock, to permit on fly in the Florida Keys. Sneaking in every opportunity we can to tie flies, cast to fish, or watch videos to inspire our next trip, we balance our college education and our passion.
                        </p>
                    </div>
                </div>
            </Slide>
            
            {/* Main Content Section */}
            <div className="bg-gray-50">
                <div className="max-w-7xl mx-auto px-6 py-16">
                    {/* Mission Statement Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                        {/* Left Column - Mission */}
                        <div className="space-y-8">
                            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 h-64 flex flex-col">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="bg-green-100 p-3 rounded-full">
                                        <FaUsers className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
                                </div>
                                <p className="text-xl text-gray-700 leading-relaxed flex-1">
                                    Our goal at ForReelFlies is to bridge the gap between those who love to tie flies and those who love to use them. We want to connect our amazing fly tiers with you to help fool that fish you have always wanted to catch.
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 h-64 flex flex-col">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="bg-blue-100 p-3 rounded-full">
                                        <FaFish className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Community Stories</h2>
                                </div>
                                <p className="text-xl text-gray-700 leading-relaxed flex-1">
                                    Our blog is a culmination of your catches on flies purchased from one of our vendors. Be sure to send us pictures for us to post!
                                </p>
                            </div>
                        </div>

                        {/* Right Column - Quality & Partnership */}
                        <div className="space-y-8">
                            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 h-64 flex flex-col">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="bg-purple-100 p-3 rounded-full">
                                        <FaHeart className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Quality Promise</h2>
                                </div>
                                <p className="text-xl text-gray-700 leading-relaxed flex-1">
                                    We take great care in finding trusted vendors who share our dedication to quality and performance.
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 h-64 flex flex-col">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="bg-green-100 p-3 rounded-full">
                                        <FaStore className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900">Join Our Network</h2>
                                </div>
                                <p className="text-xl text-gray-700 leading-relaxed flex-1">
                                    Join us and <button 
                                        onClick={handleBecomeVendorClick}
                                        className="text-green-600 font-semibold hover:text-green-700 underline decoration-2 underline-offset-2 cursor-pointer"
                                    >
                                        Become a Vendor
                                    </button> and share your passion for fly tying with anglers everywhere.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Call to Action Section */}
                    <div className="bg-white rounded-2xl shadow-2xl p-12 text-center border border-gray-100">
                        <div className="max-w-3xl mx-auto">
                            <h3 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">Share Your Passion!</h3>
                            <p className="text-xl mb-8 text-gray-700 leading-relaxed">
                                Ready to share your passion for fly tying with anglers everywhere? Join our community of skilled fly tiers and start selling your creations today.
                            </p>
                            <button 
                                onClick={handleBecomeVendorClick}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-xl font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 inline-block"
                            >
                                Become a Vendor
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}