import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "@/db/schema";

type VerifyUserRow = {
  id: string;
  username: string;
  display_name: string;
  profile_image_url: string | null;
};

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

        const db = getDb();
        const result = await db.execute(
          sql`select * from verify_user(${credentials.username}, ${credentials.password})`
        );
        const rows = result.rows as VerifyUserRow[];
        if (!rows || rows.length === 0) return null;

        const user = rows[0];

        await db
          .update(users)
          .set({ last_login_at: new Date() })
          .where(eq(users.id, user.id));

        return {
          id: user.id,
          name: user.username,
          display_name: user.display_name || user.username,
          username: user.username,
          profile_image_url: user.profile_image_url || null,
        } as any;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/login`,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.username = (user as any).username;
        token.display_name = (user as any).display_name;
        token.profile_image_url = (user as any).profile_image_url || null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).username = (token.username as string) || "";
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
