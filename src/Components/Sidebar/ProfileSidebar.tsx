import SignoutButton from "../buttons/SignOutButton";
import { TextLink } from "../Links";
import Sidebar from "./Sidebar";
import { useRouter } from "next/navigation";

export default function ProfileSidebar({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
    const router = useRouter();

    const onSignOut = () => {
        setOpen(false);
        router.refresh();
    }

    return (
        <Sidebar open={open} setOpen={setOpen}>
            <div className="flex flex-col gap-8 h-full px-6 py-1">
                <div className="flex flex-col items-center">
                    <h1>LOGO</h1>
                    <h1 className="text-2xl">MY ACCOUNT</h1>
                </div>
                <div className="flex flex-col h-[75%] justify-between">
                    <TextLink href="/my-account" text="DASHBOARD" onClick={() => setOpen(false)} />
                    <TextLink href="/my-account/orders" text="ORDERS" onClick={() => setOpen(false)} />
                    <TextLink href="/my-account/wishlist" text="WISHLIST" onClick={() => setOpen(false)} />
                    <TextLink href="/my-account/edit-address" text="ADDRESSES" onClick={() => setOpen(false)} />
                    <TextLink href="/my-account/payment-methods" text="PAYMENT METHODS" onClick={() => setOpen(false)} />
                    <TextLink href="/my-account/edit-account" text="ACCOUNT SETTINGS" onClick={() => setOpen(false)} />
                    <SignoutButton text={"LOGOUT"} onSignOut={onSignOut} />
                </div>
            </div>
        </Sidebar>
    )
}