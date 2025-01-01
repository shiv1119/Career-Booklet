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
      name: "Credentials",
      credentials: {
        email_or_phone: { label: "Email or Phone", type: "string" },
        password: { label: "Password", type: "string" },
        login_otp: { label: "LoginOTP", type: "string" }, 
        email: {label: "ActivationEmail", type: "string"},
        activation_otp: {label: "ActivationOTP", type: "string"},
      },
      async authorize(credentials) {
        let url = '';
        let body = {};
        
        if (credentials?.password) {
          url = 'http://127.0.0.1:8000/api/auth/login-password';
          body = {
            email_or_phone: credentials.email_or_phone,
            password: credentials.password,
          };
        }
        else if (credentials?.activation_otp) {
          url = 'http://127.0.0.1:8000/api/user/activate';
          body = {
            email: credentials.email,
            otp: credentials.activation_otp,
          };
        }
        else if (credentials?.login_otp) {
          url = 'http://127.0.0.1:8000/api/auth/login-otp';
          body = {
            email_or_phone: credentials.email_or_phone,
            otp: credentials.login_otp,
          };
        }
        
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          return await res.json(); 
        }
        return null;
      },
    }),
  ],
  
  callbacks: {
    async session({ session, token, user }) {
      return session; 
    },
    async jwt({ token, user }) {
      if (user && 'tokens' in user) {
        const userWithTokens = user as UserWithTokens;
        token.refreshToken = userWithTokens.tokens.refresh_token;
        token.accessToken = userWithTokens.tokens.access_token;
        token.expiresIn = 3600;
      }
      return token; 
    }
  },

  pages: {
    signIn: '/auth/login-password', 
    newUser: '/auth/register', 
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
