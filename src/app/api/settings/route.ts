import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type Settings = {
  site_title: string;
  status_unread: string;
  status_read: string;
  status_done: string;
  tab_diary: string;
  tab_notes: string;
  tab_todo: string;
};

const defaults: Settings = {
  site_title: "ちひろノート",
  status_unread: "未読",
  status_read: "既読",
  status_done: "読んだ",
  tab_diary: "日記",
  tab_notes: "ノート",
  tab_todo: "TO-DO",
};

export async function GET() {
  const { data } = await supabaseAdmin
    .from("settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (!data) {
    return NextResponse.json(defaults);
  }

  return NextResponse.json({
    site_title: data.site_title || defaults.site_title,
    status_unread: data.status_unread || defaults.status_unread,
    status_read: data.status_read || defaults.status_read,
    status_done: data.status_done || defaults.status_done,
    tab_diary: data.tab_diary || defaults.tab_diary,
    tab_notes: data.tab_notes || defaults.tab_notes,
    tab_todo: data.tab_todo || defaults.tab_todo,
  });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const username = (session.user as any).username as string;
  if (username !== "genji") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await request.json();
  const updates: Partial<Settings> = {};

  if (typeof body.site_title === "string" && body.site_title.trim()) {
    updates.site_title = body.site_title.trim();
  }
  if (typeof body.status_unread === "string" && body.status_unread.trim()) {
    updates.status_unread = body.status_unread.trim();
  }
  if (typeof body.status_read === "string" && body.status_read.trim()) {
    updates.status_read = body.status_read.trim();
  }
  if (typeof body.status_done === "string" && body.status_done.trim()) {
    updates.status_done = body.status_done.trim();
  }
  if (typeof body.tab_diary === "string" && body.tab_diary.trim()) {
    updates.tab_diary = body.tab_diary.trim();
  }
  if (typeof body.tab_notes === "string" && body.tab_notes.trim()) {
    updates.tab_notes = body.tab_notes.trim();
  }
  if (typeof body.tab_todo === "string" && body.tab_todo.trim()) {
    updates.tab_todo = body.tab_todo.trim();
  }

  const { data, error } = await supabaseAdmin
    .from("settings")
    .upsert({ id: 1, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
