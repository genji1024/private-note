import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import type { Thread, ThreadComment, UserProfile } from "@/lib/types";
import UserMenu from "@/components/UserMenu";
import HomePageClient from "@/components/HomePageClient";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as any).id as string;
  const displayName =
    ((session.user as any).display_name as string) || session.user?.name || "";
  const profileImageUrl = (session.user as any).profile_image_url as
    string | null;

  const { data: userRows } = await supabaseAdmin
    .from("users")
    .select("id, display_name, profile_image_url, created_at, last_login_at");
  const userProfiles: Record<string, UserProfile> = {};
  for (const u of userRows || []) {
    userProfiles[u.id] = {
      display_name: u.display_name,
      profile_image_url: u.profile_image_url,
      created_at: u.created_at,
      last_login_at: u.last_login_at,
    };
  }

  // Fetch all threads (diary thread has is_default=true)
  const { data: threads } = await supabaseAdmin.rpc("get_threads");

  const diaryThread = threads?.find((t: Thread) => t.is_default) || null;
  const otherThreads = threads?.filter((t: Thread) => !t.is_default) || [];

  // Fetch diary entries (comments in the diary thread)
  let diaryEntries: ThreadComment[] = [];
  if (diaryThread) {
    const { data } = await supabaseAdmin.rpc(
      "get_diary_entries_with_read_status",
      { p_current_user_id: userId }
    );
    diaryEntries = (data as ThreadComment[]) || [];
  }

  // Fetch comments for each non-default thread
  const threadsWithComments: { thread: Thread; comments: ThreadComment[] }[] =
    [];
  for (const t of otherThreads) {
    const { data: comments } = await supabaseAdmin.rpc("get_thread_comments", {
      p_thread_id: t.id,
    });
    threadsWithComments.push({
      thread: t,
      comments: (comments as ThreadComment[]) || [],
    });
  }

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ fontSize: "1.5rem" }}>ちひろノート</h2>
        <UserMenu displayName={displayName} profileImageUrl={profileImageUrl} />
      </div>

      <HomePageClient
        diaryThread={diaryThread}
        diaryEntries={diaryEntries}
        threadsWithComments={threadsWithComments}
        currentUserId={userId}
        userProfiles={userProfiles}
      />
    </div>
  );
}
