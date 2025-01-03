import NextAuth, { User, type DefaultSession } from "next-auth";

declare module "next-auth" {

  interface Credentials {
    email_or_phone: string,
    password: string,
  }
  interface Session {
    user: {
      id: string;
      token: string;
      name: string;
      phone: string;
      role: string;
      picture: string;
      email: string;
    };
    accessToken: string;
  }
  interface User {
    id: string;
    token: string;
    name: string;
    phone: string;
    role: string;
    picture: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user: {
      id: string;
      token: string;
      name: string;
      phone: string;
      role: string;
      picture: string;
    };
  }
}

interface 