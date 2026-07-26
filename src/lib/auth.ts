import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "./supabase";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "ユーザ名", type: "text" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const { data, error } = await supabase.rpc("verify_user", {
          p_username: credentials.username,
          p_password: credentials.password,
        });

        if (error || !data || data.length === 0) return null;

        const user = data[0];
        return {
          id: user.id,
          name: user.display_name || user.username,
          display_name: user.display_name || user.username,
          profile_image_url: user.profile_image_url || null,
        } as any;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.display_name = (user as any).display_name;
        token.profile_image_url = (user as any).profile_image_url || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).display_name =
          (token.display_name as string) || "";
        (session.user as any).profile_image_url =
          (token.profile_image_url as string) || null;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
