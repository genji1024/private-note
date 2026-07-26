import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, body, image_url } = await req.json();
  const authorId = (session.user as any).id;

  const { error } = await supabaseAdmin.from("entries").insert({
    author_id: authorId,
    title,
    body,
    image_url: image_url || null,
  });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, title, body, image_url } = await req.json();
  const userId = (session.user as any).id;

  const { data: entry } = await supabaseAdmin
    .from("entries")
    .select("author_id")
    .eq("id", id)
    .single();

  if (!entry || entry.author_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("entries")
    .update({ title, body, image_url, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const userId = (session.user as any).id;

  const { data: entry } = await supabaseAdmin
    .from("entries")
    .select("author_id")
    .eq("id", id)
    .single();

  if (!entry || entry.author_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabaseAdmin.from("entries").delete().eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
