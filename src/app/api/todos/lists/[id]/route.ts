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

  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "タイトルは必須です" }, { status: 400 });
  }

  const { data: list } = await supabaseAdmin
    .from("todo_lists")
    .select("created_by")
    .eq("id", params.id)
    .single();

  if (!list) {
    return NextResponse.json(
      { error: "リストが見つかりません" },
      { status: 404 }
    );
  }
  if (list.created_by !== userId) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("todo_lists")
    .update({ title: body.title.trim(), updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .select("id, title, created_by, created_at, updated_at")
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

  const { data: list } = await supabaseAdmin
    .from("todo_lists")
    .select("created_by")
    .eq("id", params.id)
    .single();

  if (!list) {
    return NextResponse.json(
      { error: "リストが見つかりません" },
      { status: 404 }
    );
  }
  if (list.created_by !== userId) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("todo_lists")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
