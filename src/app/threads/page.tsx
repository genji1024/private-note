import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import type { Thread } from "@/lib/types";
import NewThreadForm from "@/components/NewThreadForm";
import ThreadItem from "@/components/ThreadItem";
import LogoutButton from "@/components/LogoutButton";

export default async function ThreadsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as any).id as string;

  const { data: threads } = await supabaseAdmin.rpc("get_threads");

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
        <h2 style={{ fontSize: "1.5rem" }}>スレッド</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <a href="/" className="btn btn--ghost">
            日記に戻る
          </a>
          <a href="/profile" className="btn btn--ghost">
            プロフィール
          </a>
          <LogoutButton />
        </div>
      </div>
      <NewThreadForm />
      {threads && threads.length > 0 ? (
        threads.map((t: Thread) => (
          <ThreadItem key={t.id} thread={t} currentUserId={userId} />
        ))
      ) : (
        <p style={{ color: "#999", textAlign: "center" }}>
          スレッドがありません
        </p>
      )}
    </div>
  );
}
