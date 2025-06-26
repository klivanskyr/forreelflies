import "next-auth"
import { VendorSignUpStatus } from "@/app/types/types"

declare module "next-auth" {
  interface User {
    uid: string
    username: string
    vendorSignUpStatus: VendorSignUpStatus
    phoneNumber?: string
    streetAddress?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
    photoURL?: string
    isAdmin?: boolean
    isVendor?: boolean
    stripeDetailsSubmitted?: boolean
  }

  interface Session {
    user: {
      uid: string
      email: string
      name: string
      username: string
      vendorSignUpStatus: VendorSignUpStatus
      phoneNumber?: string
      streetAddress?: string
      city?: string
      state?: string
      zipCode?: string
      country?: string
      photoURL?: string
      isAdmin?: boolean
      isVendor?: boolean
      stripeDetailsSubmitted?: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string
    username: string
    vendorSignUpStatus: VendorSignUpStatus
    phoneNumber?: string
    streetAddress?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
    photoURL?: string
    isAdmin?: boolean
    isVendor?: boolean
    stripeDetailsSubmitted?: boolean
  }
} 