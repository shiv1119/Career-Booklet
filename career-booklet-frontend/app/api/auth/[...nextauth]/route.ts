import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions, DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { getProfile } from "../../profile/route";

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
  refreshTokenExpires: number;
  id?: number;
  name?: string;
  image?: string;
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      accessToken?: string;
      id?: number;
      name?: string;
      image?: string;
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
        recover_otp: { label: "RecoverOTP", type: "string" },
      },
      async authorize(credentials) {
        let url = "";
        let body = {};

        if (credentials?.password) {
          url = `${process.env.NEXT_PUBLIC_AUTH_SERVICE}/api/auth/login-password`;
          body = {
            email_or_phone: credentials.email_or_phone,
            password: credentials.password,
          };
        } else if (credentials?.activation_otp) {
          url = `${process.env.NEXT_PUBLIC_AUTH_SERVICE}/api/user/activate`;
          body = {
            email: credentials.email,
            otp: credentials.activation_otp,
          };
        } else if (credentials?.login_otp) {
          url = `${process.env.NEXT_PUBLIC_AUTH_SERVICE}/api/auth/login-otp`;
          body = {
            email_or_phone: credentials.email_or_phone,
            otp: credentials.login_otp,
          };
        } else if (credentials?.recover_otp) {
          url = `${process.env.NEXT_PUBLIC_AUTH_SERVICE}/api/auth/recover-account`;
          body = {
            email: credentials.email,
            otp: credentials.recover_otp,
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
        token.expiresIn = 86400;
        token.accessTokenExpires = currentTime + 86400 * 1000;
        token.refreshTokenExpires = currentTime + 7 * 86400 * 1000;
      
        console.log(userWithTokens);

        const profile = await getProfile((token as Token).accessToken);
        if (profile) {
          token.name = profile.full_name;
          token.image = profile.profile_image;
        }
      }

      if (typeof token.accessTokenExpires === "number" && currentTime > token.accessTokenExpires) {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_AUTH_SERVICE}/api/auth/refresh-token`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({ refresh_token: token.refreshToken }),
            }
          );

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
        name: (token as Token).name,
        image: (token as Token).image,
      };
      console.log(session);
      return session;
    },
  },

  pages: {
    signIn: "/auth/login-password",
    newUser: "/auth/register",
    signOut: "/",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
