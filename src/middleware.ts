import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {

    // Shop default params
    const DEFAULT_PARAMS = {
        sort: "latest",
        pageSize: "10",
        page: "1",
        layout: "grid3"
    };
    
    if (request.nextUrl.pathname.startsWith("/shop")) {
        let updated = false;

        Object.entries(DEFAULT_PARAMS).forEach(([key, value]) => {
            if (!request.nextUrl.searchParams.has(key)) {
                request.nextUrl.searchParams.set(key, value);
                updated = true;
            }
        });

        if (updated) {
            return NextResponse.redirect(request.nextUrl.toString());
        }
    }
}
 
// // See "Matching Paths" below to learn more
// export const config = {
//   matcher: '/about/:path*',
// }