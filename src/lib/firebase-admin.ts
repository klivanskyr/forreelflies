import { initializeApp, getApps, ServiceAccount } from 'firebase-admin/app';
import admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { VendorSignUpStatus } from '@/app/types/types';

const serviceAccount = {
    type: process.env.FIREBASE_ADMIN_TYPE,
    project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
    private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY,
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
    auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
    token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_ADMIN_UNIVERSE_DOMAIN
} as ServiceAccount;

let adminApp;

if (!getApps().some(app => app.name === 'admin')) {
    adminApp = initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://book-manager-3fe0f-default-rtdb.firebaseio.com",
    }, 'admin');
} else {
    adminApp = getApps().find(app => app.name === 'admin');
}

const adminAuth = getAuth(adminApp);

export { adminApp, adminAuth };

export type DbUser = {
    uid: string;
    email: string;
    username: string;
    vendorSignUpStatus: VendorSignUpStatus;
    phoneNumber?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    photoURL?: string;
    isAdmin?: boolean;
}

export const tokenToUser = async (): Promise<DbUser | null> => {
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

        return user as DbUser;
    } catch (error) {
        console.error(error);
        return null;
    }
}