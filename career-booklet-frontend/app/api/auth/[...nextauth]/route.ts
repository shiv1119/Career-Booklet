import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions, DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";

interface UserWithTokens {
  id: string;
  email: string;
  tokens: {
    access_token: string;
    refresh_token: string;
  };
}

interface Token extends JWT {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  accessTokenExpires: number;
  id?: number;
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      accessToken?: string;
      id?:number;
    } & DefaultSession["user"];
  }
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email_or_phone: { label: "Email or Phone", type: "string" },
        password: { label: "Password", type: "string" },
        login_otp: { label: "LoginOTP", type: "string" },
        email: { label: "ActivationEmail", type: "string" },
        activation_otp: { label: "ActivationOTP", type: "string" },
      },
      async authorize(credentials) {
        let url = "";
        let body = {};

        if (credentials?.password) {
          url = "http://127.0.0.1:9000/api/auth/login-password";
          body = {
            email_or_phone: credentials.email_or_phone,
            password: credentials.password,
          };
        } else if (credentials?.activation_otp) {
          url = "http://127.0.0.1:9000/api/user/activate";
          body = {
            email: credentials.email,
            otp: credentials.activation_otp,
          };
        } else if (credentials?.login_otp) {
          url = "http://127.0.0.1:9000/api/auth/login-otp";
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
          const data = await res.json();
          if (data?.tokens?.access_token && data?.tokens?.refresh_token) {
            return data;
          } else {
            throw new Error("MFA Required");
          }
        } else {
          const data = await res.json();
          throw new Error(data?.detail);
        }
      },
    }),
  ],
  
  callbacks: {
    async jwt({ token, user }) {
      const currentTime = Date.now();
      
      if (user && "tokens" in user) {
        const userWithTokens = user as UserWithTokens;
        token.id = userWithTokens.id;
        token.accessToken = userWithTokens.tokens.access_token;
        token.refreshToken = userWithTokens.tokens.refresh_token;
        token.expiresIn = 3600;
        token.accessTokenExpires = currentTime + 3600 * 1000;
        console.log(userWithTokens);
      }

      if (typeof token.accessTokenExpires === "number" && currentTime > token.accessTokenExpires) {
        try {
          const res = await fetch("http://127.0.0.1:9000/api/auth/refresh-token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ refresh_token: token.refreshToken }),
          });

          if (res.ok) {
            const data = await res.json();
            token.accessToken = data.access_token;
            token.accessTokenExpires = currentTime + 3600 * 1000;
            token.refreshToken = data.refresh_token || token.refreshToken;
          } else {
            throw new Error("Failed to refresh token");
          }
        } catch (error) {
          console.error("Error refreshing access token:", error);
          throw error;
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.user = {
        ...session.user,
        accessToken: (token as Token).accessToken,
        id: (token as Token).id,
      };
      console.log(session);
      return session;
    },
  },

  pages: {
    signIn: "/auth/login-password",
    newUser: "/auth/register",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
