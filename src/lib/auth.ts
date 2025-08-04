import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "./firebase"
import { doc, getDoc } from "firebase/firestore"
import { db } from "./firebase"
import { VendorSignUpStatus } from "@/app/types/types"

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function rateLimit(ip: string, limit: number = 20, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Sign in with Firebase Auth
          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          )

          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, "users", userCredential.user.uid))
          
          if (!userDoc.exists()) {
            return null
          }

          const userData = userDoc.data()
          
          return {
            id: userCredential.user.uid,
            email: userCredential.user.email,
            name: userData.username || userCredential.user.email?.split('@')[0],
            uid: userCredential.user.uid,
            username: userData.username,
            vendorSignUpStatus: userData.vendorSignUpStatus || "notStarted",
            phoneNumber: userData.phoneNumber,
            streetAddress: userData.streetAddress,
            city: userData.city,
            state: userData.state,
            zipCode: userData.zipCode,
            country: userData.country,
            photoURL: userData.photoURL,
            isAdmin: userData.isAdmin || false,
            isVendor: (userData.vendorSignUpStatus || "notStarted") === 'vendorActive' || 
                     (userData.vendorSignUpStatus || "notStarted") === 'onboardingStarted' || 
                     (userData.vendorSignUpStatus || "notStarted") === 'onboardingCompleted'
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Persist user data to token
      if (user) {
        token.uid = user.uid
        token.username = user.username
        token.vendorSignUpStatus = user.vendorSignUpStatus
        token.phoneNumber = user.phoneNumber
        token.streetAddress = user.streetAddress
        token.city = user.city
        token.state = user.state
        token.zipCode = user.zipCode
        token.country = user.country
        token.photoURL = user.photoURL
        token.isAdmin = user.isAdmin
        token.isVendor = user.isVendor
        // Add timestamp for caching
        token.lastUpdated = Date.now()
      }

      // Handle session updates
      if (trigger === "update" && session) {
        return { ...token, ...session }
      }

      return token
    },
    async session({ session, token }) {
      // Always fetch fresh data for vendor status to ensure UI updates immediately
      const shouldFetchFresh = !token.lastUpdated || 
        (Date.now() - (token.lastUpdated as number)) > 30 * 1000 || // 30 seconds (reduced from 5 minutes)
        !token.vendorSignUpStatus // Force fetch if vendor status is missing

      if (token?.uid && shouldFetchFresh) {
        try {
          const userDoc = await getDoc(doc(db, "users", token.uid as string))
          
          if (userDoc.exists()) {
            const userData = userDoc.data()
            
            // Update session with fresh data from database
            session.user.uid = token.uid as string
            session.user.username = userData.username || token.username as string
            session.user.vendorSignUpStatus = userData.vendorSignUpStatus || "notStarted"
            session.user.phoneNumber = userData.phoneNumber || token.phoneNumber as string
            session.user.streetAddress = userData.streetAddress || token.streetAddress as string
            session.user.city = userData.city || token.city as string
            session.user.state = userData.state || token.state as string
            session.user.zipCode = userData.zipCode || token.zipCode as string
            session.user.country = userData.country || token.country as string
            session.user.photoURL = userData.photoURL || token.photoURL as string
            session.user.isAdmin = userData.isAdmin || false
            session.user.isVendor = (userData.vendorSignUpStatus || "notStarted") === 'vendorActive' || 
                                   (userData.vendorSignUpStatus || "notStarted") === 'onboardingStarted' || 
                                   (userData.vendorSignUpStatus || "notStarted") === 'onboardingCompleted'
            
            // Update token with fresh data and timestamp
            token.lastUpdated = Date.now()
          } else {
            // Fallback to token data if document doesn't exist
            session.user.uid = token.uid as string
            session.user.username = token.username as string
            session.user.vendorSignUpStatus = token.vendorSignUpStatus as VendorSignUpStatus
            session.user.phoneNumber = token.phoneNumber as string
            session.user.streetAddress = token.streetAddress as string
            session.user.city = token.city as string
            session.user.state = token.state as string
            session.user.zipCode = token.zipCode as string
            session.user.country = token.country as string
            session.user.photoURL = token.photoURL as string
            session.user.isAdmin = token.isAdmin as boolean
            session.user.isVendor = token.isVendor as boolean
          }
        } catch (error) {
          console.error("Error fetching fresh user data:", error)
          // Fallback to token data if there's an error
          session.user.uid = token.uid as string
          session.user.username = token.username as string
          session.user.vendorSignUpStatus = token.vendorSignUpStatus as VendorSignUpStatus
          session.user.phoneNumber = token.phoneNumber as string
          session.user.streetAddress = token.streetAddress as string
          session.user.city = token.city as string
          session.user.state = token.state as string
          session.user.zipCode = token.zipCode as string
          session.user.country = token.country as string
          session.user.photoURL = token.photoURL as string
          session.user.isAdmin = token.isAdmin as boolean
          session.user.isVendor = token.isVendor as boolean
        }
      } else {
        // Use cached token data
        session.user.uid = token.uid as string
        session.user.username = token.username as string
        session.user.vendorSignUpStatus = token.vendorSignUpStatus as VendorSignUpStatus
        session.user.phoneNumber = token.phoneNumber as string
        session.user.streetAddress = token.streetAddress as string
        session.user.city = token.city as string
        session.user.state = token.state as string
        session.user.zipCode = token.zipCode as string
        session.user.country = token.country as string
        session.user.photoURL = token.photoURL as string
        session.user.isAdmin = token.isAdmin as boolean
        session.user.isVendor = token.isVendor as boolean
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin', // Optional: custom sign in page
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
} 