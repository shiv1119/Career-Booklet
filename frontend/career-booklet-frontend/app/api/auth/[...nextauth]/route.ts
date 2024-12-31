import NextAuth from "next-auth";
import { CredentialsProvider } from "next-auth/providers/credentials";

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      async authorize(credentials, req) {
        const url = 'http://127.0.0.1:8000/api/auth/login-password';
        const formData = new URLSearchParams();
        formData.append('email_or_phone',credentials.email);
        formData.append('password',credentials.password);
        const res = await fetch(url, {
          method: "POST",
          headers: {"Accept": "application/json"},
          body: FormData
        });
        if(res.ok){
          return await res.json();
        }
        return null
      }
    })
  ],
  pages: {
    signIn:'/auth',
    newUser: '/auth'
  }

}

const handler = NextAuth(authOptions);

export { handler as GET,handler as POST };