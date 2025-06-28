import Image from "next/image";
import Link from "next/link";
import logo from "@/../public/logo_noback.png";
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";

export default function Footer() {
    return (
        <div className="w-full flex flex-col">
            <div className="flex flex-col bg-gray-100 p-4 md:p-6">
                <div className="flex flex-col md:flex-row w-full justify-around gap-8 md:gap-4">
                    <div className="flex flex-col items-center md:items-start gap-2">
                        <Link href="/">
                            <Image 
                                src={logo.src} 
                                alt="ForReelFlies Logo" 
                                width={300} 
                                height={300} 
                                className="w-[200px] md:w-[250px] h-auto"
                            />
                        </Link>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <h3 className="footer-header text-center md:text-left">Important Links</h3>
                        <div className="flex flex-col items-center md:items-start">
                            <Link href="/privacy-policy" className="text-sm md:text-base hover:text-gray-700 transition-colors">
                                Privacy Policies
                            </Link>
                            <Link href="/refund-policy" className="text-sm md:text-base hover:text-gray-700 transition-colors">
                                Refund and Return Policies
                            </Link>
                            <Link href="/shop" className="text-sm md:text-base hover:text-gray-700 transition-colors">
                                Shop
                            </Link>
                            <Link href="/contact" className="text-sm md:text-base hover:text-gray-700 transition-colors">
                                Contact Us
                            </Link>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <h3 className="footer-header text-center md:text-left">Categories</h3>
                        <div className="flex flex-col items-center md:items-start">
                            <Link href="/shop?category=dry-flies" className="text-sm md:text-base hover:text-gray-700 transition-colors">
                                Dry Flies
                            </Link>
                            <Link href="/shop?category=nymphs" className="text-sm md:text-base hover:text-gray-700 transition-colors">
                                Nymphs
                            </Link>
                            <Link href="/shop?category=streamers" className="text-sm md:text-base hover:text-gray-700 transition-colors">
                                Streamers
                            </Link>
                            <Link href="/shop?category=saltwater-flies" className="text-sm md:text-base hover:text-gray-700 transition-colors">
                                Saltwater Flies
                            </Link>
                            <Link href="/shop?category=wet-flies" className="text-sm md:text-base hover:text-gray-700 transition-colors">
                                Wet Flies
                            </Link>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <h3 className="footer-header text-center md:text-left">Contact Us</h3>
                        <div className="flex flex-col items-center md:items-start">
                            <Link href="mailto:forreelflies@gmail.com" className="text-sm md:text-base hover:text-gray-700 transition-colors">
                                Email: forreelflies@gmail.com
                            </Link>
                            <Link href="tel:+17325150892" className="text-sm md:text-base hover:text-gray-700 transition-colors">
                                Phone: +1 (732) 515-0892
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center md:items-start mt-8 md:mt-6">
                    <h3 className="footer-header">Follow Us</h3>
                    <div className="my-3 flex flex-row gap-4">
                        <Link href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">
                            <FaFacebook className="text-xl md:text-2xl hover:fill-gray-700 transition-all" />
                        </Link>
                        <Link href="https://twitter.com/" target="_blank" rel="noopener noreferrer">
                            <FaTwitter className="text-xl md:text-2xl hover:fill-gray-700 transition-all" />
                        </Link>
                        <Link href="https://www.youtube.com/" target="_blank" rel="noopener noreferrer">
                            <FaYoutube className="text-xl md:text-2xl hover:fill-gray-700 transition-all" />
                        </Link>
                        <Link href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer">
                            <FaInstagram className="text-xl md:text-2xl hover:fill-gray-700 transition-all" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* <div className="flex flex-row w-full justify-center items-center p-0.5">
                <h4 className="">ForReelFlies made by <Link href="https://ryanklivansky.com"><span className="font-medium text-blue-500">Ryan Klivansky</span></Link></h4>
            </div> */}
        </div>
    )
}