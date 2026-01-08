import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export default async function middleware(req: any) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
        // Get the current URL without any query parameters
        const url = new URL(req.url);
        const loginUrl = new URL('/auth/cover-login', req.url);

        // Redirect to login without any callbackUrl or other parameters
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|assets|auth).*)'],
};
