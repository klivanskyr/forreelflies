import { TextLink } from "../Links";
import Sidebar from "./Sidebar";
import { useRouter } from "next/navigation";

export default function ProfileSidebar({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
    const router = useRouter();

    const signOut = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signout`, {
                method: "POST",
                credentials: "include",
            })

            if (response.ok) {
                setOpen(false);
                router.refresh();
            } else {
                console.error("Failed to log out");
            }
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <Sidebar open={open} setOpen={setOpen}>
            <div className="flex flex-col gap-8 h-full px-6 py-1">
                <div className="flex flex-col items-center">
                    <h1>LOGO</h1>
                    <h1 className="text-2xl">MY ACCOUNT</h1>
                </div>
                <div className="flex flex-col h-[75%] justify-between">
                    <TextLink href="/" text="DASHBOARD" />
                    <TextLink href="/" text="ORDERS" />
                    <TextLink href="/" text="WISHLIST" />
                    <TextLink href="/" text="ADDRESSES" />
                    <TextLink href="/" text="PAYMENT METHODS" />
                    <TextLink href="/" text="ACCOUNT SETTINGS" />
                    <button className="linkhover text-lg w-fit" onClick={() => signOut()}>LOGOUT</button>
                </div>
            </div>
        </Sidebar>
    )
}