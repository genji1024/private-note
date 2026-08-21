import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";
import ProfileForm from "@/components/ProfileForm";
import LogoutButton from "@/components/LogoutButton";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as any).id as string;

  const rows = await getDb()
    .select({
      username: users.username,
      display_name: users.display_name,
      profile_image_url: users.profile_image_url,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const user = rows[0];

  if (!user) redirect("/login");

  return (
    <div className="container">
      <div style={{ marginBottom: "1.5rem" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            color: "var(--accent)",
            textDecoration: "none",
            fontSize: "0.95rem",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          戻る
        </Link>
      </div>
      <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem" }}>
        プロフィール設定
      </h2>
      <ProfileForm
        initialDisplayName={user.display_name}
        initialProfileImage={user.profile_image_url}
        username={user.username}
      />
      <div style={{ marginTop: "2rem", textAlign: "center" }}>
        <LogoutButton />
      </div>
    </div>
  );
}
