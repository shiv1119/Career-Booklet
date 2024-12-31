import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";

interface UserWithTokens {
  id: string;
  email: string;
  tokens: {
    access_token: string;
    refresh_token: string;
  };
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email_or_phone: { label: "Email", type: "string" },
        password: { label: "Password", type: "string" }
      },
      async authorize(credentials) {
        const url = 'http://127.0.0.1:8000/api/auth/login-password';
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({
            email_or_phone: credentials?.email_or_phone,
            password: credentials?.password
          })
        });

        if (res.ok) {
          return await res.json();
        }

        return null;
      }
    })
  ],
  callbacks: {
    async session({session ,token,user}){
      return session
    },
    async jwt({ token, user }) {
      if (user && 'tokens' in user) {
        const userWithTokens = user as UserWithTokens;
        token.refreshToken = userWithTokens.tokens.refresh_token;
        token.accessToken = userWithTokens.tokens.access_token;
        token.expiresIn = 3600;
      }
      console.log(token, user);
      return token;
    }
  },
  pages: {
    signIn: '/auth/login-password',
    newUser: '/auth/register'
  }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
