'use client';

export default function SignOutButton({ text, startingIcon, onSignOut=() => {}, className="" }: { text: string, startingIcon?: JSX.Element, onSignOut?: () => void, className?: string }) {
    const signOut = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signout`, {
                method: "POST",
                credentials: "include",
            })

            if (response.ok) {
                onSignOut();
            } else {
                console.error("Failed to log out");
            }
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <button className={`${className} linkhover text-lg w-fit flex flex-row items-center gap-1.5`} 
            onClick={() => signOut()}
        >
            {startingIcon ? startingIcon : <></>}
            <h1>{text}</h1>
        </button>
    )
}