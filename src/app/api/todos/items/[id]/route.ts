import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const body = await request.json();
  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.title === "string" && body.title.trim()) {
    updates.title = body.title.trim();
  }
  if (typeof body.done === "boolean") {
    updates.done = body.done;
    if (body.done) {
      updates.done_by = userId;
      updates.done_at = new Date().toISOString();
    } else {
      updates.done_by = null;
      updates.done_at = null;
    }
  }

  const { data, error } = await supabaseAdmin
    .from("todo_items")
    .update(updates)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  const { data: item } = await supabaseAdmin
    .from("todo_items")
    .select("created_by")
    .eq("id", params.id)
    .single();

  if (!item) {
    return NextResponse.json(
      { error: "項目が見つかりません" },
      { status: 404 }
    );
  }
  if (item.created_by !== userId) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("todo_items")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
