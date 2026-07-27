import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("reaction_types")
    .select("*")
    .order("sort_order");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const username = (session.user as any).username as string;
  if (username !== "genji") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.type || !body.value) {
    return NextResponse.json(
      { error: "type と value は必須です" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("reaction_types")
    .insert({
      type: body.type,
      value: body.value,
      label: body.label || "",
      sort_order: body.sort_order || 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
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
  if (!body.id) {
    return NextResponse.json({ error: "id は必須です" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (body.type) updates.type = body.type;
  if (body.value) updates.value = body.value;
  if (body.label !== undefined) updates.label = body.label;
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;

  const { data, error } = await supabaseAdmin
    .from("reaction_types")
    .update(updates)
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const username = (session.user as any).username as string;
  if (username !== "genji") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "id は必須です" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("reaction_types")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
