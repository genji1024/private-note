import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import AdminForm from "./AdminForm";
import type { ReactionType } from "@/lib/types";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const username = (session.user as any).username as string;
  if (username !== "genji") redirect("/");

  const { data } = await supabaseAdmin
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  const settings = {
    site_title: data?.site_title || "ちひろノート",
    status_unread: data?.status_unread || "未読",
    status_read: data?.status_read || "既読",
    status_done: data?.status_done || "読んだ",
  };

  const { data: reactionTypes } = await supabaseAdmin
    .from("reaction_types")
    .select("*")
    .order("sort_order");

  return (
    <div className="container" style={{ maxWidth: "500px" }}>
      <h2 style={{ marginBottom: "1rem" }}>Admin 設定</h2>
      <AdminForm
        settings={settings}
        initialReactionTypes={reactionTypes as ReactionType[] | null}
      />
    </div>
  );
}
