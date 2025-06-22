import "next-auth"

declare module "next-auth" {
  interface User {
    uid: string
    username: string
    vendorSignUpStatus: string
    phoneNumber?: string
    streetAddress?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
    photoURL?: string
    isAdmin?: boolean
    isVendor?: boolean
  }

  interface Session {
    user: {
      uid: string
      email: string
      name: string
      username: string
      vendorSignUpStatus: string
      phoneNumber?: string
      streetAddress?: string
      city?: string
      state?: string
      zipCode?: string
      country?: string
      photoURL?: string
      isAdmin?: boolean
      isVendor?: boolean
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid: string
    username: string
    vendorSignUpStatus: string
    phoneNumber?: string
    streetAddress?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
    photoURL?: string
    isAdmin?: boolean
    isVendor?: boolean
  }
} 