import { applicationDefault, initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { User } from 'firebase/auth';
import { cookies } from 'next/headers';

let adminApp;

if (!getApps().some(app => app.name === 'admin')) {
    adminApp = initializeApp({
        credential: applicationDefault(),
        databaseURL: "https://book-manager-3fe0f-default-rtdb.firebaseio.com",
    }, 'admin');
} else {
    adminApp = getApps().find(app => app.name === 'admin');
}

const adminAuth = getAuth(adminApp);

export { adminApp, adminAuth };

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