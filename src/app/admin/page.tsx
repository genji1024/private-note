import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { reactionTypes, settings } from "@/db/schema";
import AdminForm from "./AdminForm";
import type { ReactionType } from "@/lib/types";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const username = (session.user as any).username as string;
  if (username !== "genji") redirect("/");

  const rows = await getDb()
    .select()
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1);
  const data = rows[0];

  const settingsData = {
    site_title: data?.site_title || "ちひろノート",
    status_unread: data?.status_unread || "未読",
    status_read: data?.status_read || "既読",
    status_done: data?.status_done || "読んだ",
    tab_diary: data?.tab_diary || "日記",
    tab_notes: data?.tab_notes || "ノート",
    tab_todo: data?.tab_todo || "TO-DO",
  };

  const reactionTypeRows = await getDb()
    .select({
      id: reactionTypes.id,
      type: reactionTypes.type,
      value: reactionTypes.value,
      label: reactionTypes.label,
      sort_order: reactionTypes.sort_order,
      created_at: reactionTypes.created_at,
    })
    .from(reactionTypes)
    .orderBy(asc(reactionTypes.sort_order));

  return (
    <div className="container" style={{ maxWidth: "500px" }}>
      <h2 style={{ marginBottom: "1rem" }}>Admin 設定</h2>
      <AdminForm
        settings={settingsData}
        initialReactionTypes={(reactionTypeRows as ReactionType[]) || null}
      />
    </div>
  );
}
