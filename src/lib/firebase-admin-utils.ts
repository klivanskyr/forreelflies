import { User } from "firebase/auth";
import { cookies } from "next/headers";

export const tokenToUser = async (): Promise<User | null> => {
    try {
        const token = await cookies().get('token')?.value;

        if (!token) {
            return null;
        }

        const responseUid = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/validate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const uidData = await responseUid.json();

        if (!uidData?.uid) {
            return null;
        }

        const responseUser = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user?uid=${uidData.uid}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        const { user } = await responseUser.json();

        return user as User;
    } catch (error) {
        console.error(error);
        return null;
    }
}