import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    const res = await fetch(`${process.env.BACKEND_URL}/api/auth/admin/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email: credentials.email,
                            password: credentials.password,
                        }),
                    });

                    const data = await res.json();

                    if (res.ok && data) {
                        return {
                            id: data.user?.id || '1',
                            email: data.user?.email || credentials.email,
                            name: data.user?.name || 'Admin',
                            accessToken: data.token || data.accessToken, // Store the JWT token
                            ...data.user,
                        };
                    } else {
                        return null;
                    }
                } catch (error) {
                    console.error('Auth error:', error);
                    return null;
                }
            },
        }),
    ],
    session: {
        strategy: 'jwt',
    },
    pages: {
        signIn: '/auth/cover-login',
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.accessToken = user.accessToken;
                return {
                    ...token,
                    id: user.id,
                    email: user.email,
                    name: user.name,
                };
            }
            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string;
            session.user = {
                id: token.id as string,
                email: token.email as string,
                name: token.name as string,
            };
            return session;
        },
        async redirect({ url, baseUrl }) {
            // Allow redirects to login pages for logout
            if (url.includes('/auth/')) {
                return url;
            }
            // Always redirect to dashboard after login, ignore callbackUrl
            return baseUrl;
        },
    },
};
