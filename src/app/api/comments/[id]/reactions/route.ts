import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { data: reactions, error } = await supabaseAdmin
    .from("comment_reactions")
    .select("id, comment_id, user_id, reaction_type_id, created_at")
    .eq("comment_id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: types } = await supabaseAdmin
    .from("reaction_types")
    .select("*")
    .order("sort_order");

  return NextResponse.json({ reactions: reactions || [], types: types || [] });
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;
  const { reaction_type_id } = await request.json();

  const { data, error } = await supabaseAdmin
    .from("comment_reactions")
    .upsert(
      {
        comment_id: params.id,
        user_id: userId,
        reaction_type_id,
      },
      { onConflict: "comment_id, user_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  const { error } = await supabaseAdmin
    .from("comment_reactions")
    .delete()
    .eq("comment_id", params.id)
    .eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
