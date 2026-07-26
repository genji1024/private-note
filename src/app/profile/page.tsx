import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as any).id as string;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("username, display_name, profile_image_url")
    .eq("id", userId)
    .single();

  if (!user) redirect("/login");

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem" }}>プロフィール設定</h2>
        <a href="/" className="btn btn--ghost">戻る</a>
      </div>
      <ProfileForm
        initialDisplayName={user.display_name}
        initialProfileImage={user.profile_image_url}
        username={user.username}
      />
    </div>
  );
}
