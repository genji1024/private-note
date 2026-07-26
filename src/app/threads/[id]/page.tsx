import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import type { ThreadComment } from "@/lib/types";
import CommentCard from "@/components/CommentCard";
import NewCommentForm from "@/components/NewCommentForm";

export default async function ThreadDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as any).id as string;
  const threadId = params.id;

  const [{ data: thread }, { data: comments }] = await Promise.all([
    supabaseAdmin.from("threads").select("title, created_by").eq("id", threadId).single(),
    supabaseAdmin.rpc("get_thread_comments", { p_thread_id: threadId }),
  ]);

  if (!thread) redirect("/threads");

  return (
    <div className="container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.5rem" }}>{thread.title}</h2>
        <a href="/threads" className="btn btn--ghost">スレッド一覧</a>
      </div>
      <NewCommentForm threadId={threadId} />
      {comments && comments.length > 0 ? (
        comments.map((c: ThreadComment) => (
          <CommentCard key={c.id} comment={c} currentUserId={userId} />
        ))
      ) : (
        <p style={{ color: "#999", textAlign: "center" }}>まだコメントがありません</p>
      )}
    </div>
  );
}