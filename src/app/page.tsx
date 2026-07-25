import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Entry } from "@/lib/types";
import EntryCard from "@/components/EntryCard";
import NewEntryForm from "@/components/NewEntryForm";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const userId = (session.user as any).id as string;

  const { data: entries } = await supabase
    .rpc("get_entries_with_read_status", { p_current_user_id: userId });

  return (
    <div className="container">
      <h2 style={{ marginBottom: "1.5rem", fontSize: "1.5rem" }}>日記</h2>
      <NewEntryForm />
      {entries && entries.length > 0 ? (
        entries.map((e: Entry) => (
          <EntryCard key={e.id} entry={e} currentUserId={userId} />
        ))
      ) : (
        <p style={{ color: "#999", textAlign: "center" }}>まだ日記がありません</p>
      )}
    </div>
  );
}