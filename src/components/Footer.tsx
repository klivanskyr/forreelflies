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
                        <Image 
                            src={logo.src} 
                            alt="ForReelFlies Logo" 
                            width={200} 
                            height={200} 
                            className="w-[150px] md:w-[200px] h-auto"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <h3 className="footer-header text-center md:text-left">Important Links</h3>
                        <div className="flex flex-col items-center md:items-start">
                            <h4 className="text-sm md:text-base hover:text-gray-700 cursor-pointer">Privacy Policies</h4>
                            <h4 className="text-sm md:text-base hover:text-gray-700 cursor-pointer">Refund and Return Policies</h4>
                            <h4 className="text-sm md:text-base hover:text-gray-700 cursor-pointer">Shop</h4>
                            <h4 className="text-sm md:text-base hover:text-gray-700 cursor-pointer">Contact Us</h4>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <h3 className="footer-header text-center md:text-left">Categories</h3>
                        <div className="flex flex-col items-center md:items-start">
                            <h4 className="text-sm md:text-base hover:text-gray-700 cursor-pointer">Dry Flies</h4>
                            <h4 className="text-sm md:text-base hover:text-gray-700 cursor-pointer">Nymphs</h4>
                            <h4 className="text-sm md:text-base hover:text-gray-700 cursor-pointer">Streamers</h4>
                            <h4 className="text-sm md:text-base hover:text-gray-700 cursor-pointer">Saltwater Flies</h4>
                            <h4 className="text-sm md:text-base hover:text-gray-700 cursor-pointer">Wet Flies</h4>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <h3 className="footer-header text-center md:text-left">Contact Us</h3>
                        <div className="flex flex-col items-center md:items-start">
                            <h4 className="text-sm md:text-base">Email: test@email.com</h4>
                            <h4 className="text-sm md:text-base">Phone: 123 125 1234</h4>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center md:items-start mt-8 md:mt-6">
                    <h3 className="footer-header">Follow Us</h3>
                    <div className="my-3 flex flex-row gap-4">
                        <Link href="https://www.facebook.com/"><FaFacebook className="text-xl md:text-2xl hover:fill-gray-700 transition-all" /></Link>
                        <Link href="https://twitter.com/"><FaTwitter className="text-xl md:text-2xl hover:fill-gray-700 transition-all" /></Link>
                        <Link href="https://www.youtube.com/"><FaYoutube className="text-xl md:text-2xl hover:fill-gray-700 transition-all" /></Link>
                        <Link href="https://www.instagram.com/"><FaInstagram className="text-xl md:text-2xl hover:fill-gray-700 transition-all" /></Link>
                    </div>
                </div>
            </div>

            {/* <div className="flex flex-row w-full justify-center items-center p-0.5">
                <h4 className="">ForReelFlies made by <Link href="https://ryanklivansky.com"><span className="font-medium text-blue-500">Ryan Klivansky</span></Link></h4>
            </div> */}
        </div>
    )
}