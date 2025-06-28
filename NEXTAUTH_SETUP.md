# NextAuth Setup Instructions

## Overview
I've completely overhauled your authentication system to fix the infinite loop issue. The old system had a circular dependency where `tokenToUser()` would call `/auth/validate` which would call `/user` which would call `requireRole()` which would call `tokenToUser()` again, creating an endless loop.

## What's Changed
1. **Replaced custom auth with NextAuth.js** - A robust, industry-standard authentication library
2. **Fixed infinite loop** - No more spamming `/auth/validate` endpoint
3. **Simplified auth flow** - NextAuth handles all token management, validation, and session state
4. **Better user experience** - Faster authentication with proper loading states

## Required Environment Variables
Add this to your `.env.local` file:

```
# NextAuth Configuration
NEXTAUTH_SECRET=your-secret-key-here-generate-a-random-32-character-string
NEXTAUTH_URL=http://localhost:3000
```

To generate a secure secret, you can:
1. Use an online generator: https://generate-secret.vercel.app/32
2. Or run: `openssl rand -base64 32` (if you have OpenSSL)
3. Or use any random 32+ character string

## Files Modified
- ✅ `src/lib/auth.ts` - New NextAuth configuration
- ✅ `src/types/next-auth.d.ts` - TypeScript definitions
- ✅ `src/app/api/auth/[...nextauth]/route.ts` - NextAuth API routes
- ✅ `src/contexts/UserContext.tsx` - Updated to use NextAuth
- ✅ `src/components/Sidebar/LoginSidebar.tsx` - Updated login form
- ✅ `src/components/buttons/SignOutButton.tsx` - Updated signout
- ✅ `src/app/api/utils/withRole.ts` - Fixed to use NextAuth sessions
- ✅ `src/app/layout.tsx` - Simplified provider setup

## Old Files to Remove (Optional)
These old auth endpoints are no longer used and can be deleted:
- `src/app/api/v1/auth/signin/route.ts`
- `src/app/api/v1/auth/signout/route.ts`
- `src/app/api/v1/auth/validate/route.ts`
- `src/app/api/v1/auth/validateToken/route.ts`

## Testing
1. Add the environment variables
2. Restart your dev server: `npm run dev`
3. Try logging in - you should no longer see the infinite `/auth/validate` spam
4. Check that user data loads properly after login

## Benefits
- ✅ **No more infinite loops** - Authentication works properly
- ✅ **Better performance** - No constant API calls
- ✅ **Industry standard** - NextAuth.js is used by millions of apps
- ✅ **Better security** - Proper token handling and CSRF protection
- ✅ **Easier maintenance** - Less custom auth code to maintain

The system now uses NextAuth's session-based authentication instead of manually managing Firebase tokens. This eliminates the circular dependency that was causing your infinite loop issue. 