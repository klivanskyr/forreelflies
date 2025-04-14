import Image from "next/image";
import Link from "next/link";
import logo from "@/../public/logo_noback.png";
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";

export default function Footer() {
    return (
        <div className="w-full flex flex-col">
            <div className="flex flex-col bg-gray-100 p-6">
                <div className="flex flex-row w-full justify-around">
                    <div className="flex flex-col gap-2">
                        <Image src={logo.src} alt="ForReelFlies Logo" width={300} height={300} />
                        {/* <h4>Words are supposed to be here</h4> */}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <h3 className="footer-header">Important Links</h3>
                        <h4>Privacy Policies</h4>
                        <h4>Refund and Return Policies</h4>
                        <h4>Shop</h4>
                        <h4>Contact Us</h4>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <h3 className="footer-header">Catagories</h3>
                        <h4>Dry Flies</h4>
                        <h4>Nymphs</h4>
                        <h4>Streamers</h4>
                        <h4>Saltwater Flies</h4>
                        <h4>Wet Flies</h4>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <h3 className="footer-header">Contact Us</h3>
                        <h4>Email: test@email.com</h4>
                        <h4>Phone: 123 125 1234</h4>
                    </div>
                </div>

                <div className="flex flex-col px-6 py-2">
                    <h3 className="footer-header">Follow Us</h3>
                    <div className="my-3 flex flex-row gap-4">
                        <Link href="https://www.facebook.com/"><FaFacebook className="text-2xl hover:fill-gray-700 transition-all" /></Link>
                        <Link href="https://twitter.com/"><FaTwitter className="text-2xl hover:fill-gray-700 transition-all" /></Link>
                        <Link href="https://www.youtube.com/"><FaYoutube className="text-2xl hover:fill-gray-700 transition-all" /></Link>
                        <Link href="https://www.instagram.com/"><FaInstagram className="text-2xl hover:fill-gray-700 transition-all" /></Link>
                    </div>
                </div>
            </div>

            <div className="flex flex-row w-full justify-center items-center p-0.5">
                <h4 className="">ForReelFlies made by <Link href="https://ryanklivansky.com"><span className="font-medium text-blue-500">Ryan Klivansky</span></Link></h4>
            </div>
        </div>
    )
}