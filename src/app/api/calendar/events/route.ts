import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("calendar_events")
    .select("*")
    .order("start_at", { ascending: true });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, location, start_at, end_at, image_url } = await req.json();
  const authorId = (session.user as any).id;

  if (!title || !start_at) {
    return NextResponse.json(
      { error: "title and start_at are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("calendar_events")
    .insert({
      author_id: authorId,
      title,
      location: location || "",
      start_at,
      end_at: end_at || null,
      image_url: image_url || null,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, title, location, start_at, end_at, image_url } = await req.json();
  const userId = (session.user as any).id;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from("calendar_events")
    .select("author_id")
    .eq("id", id)
    .single();

  if (!existing || existing.author_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (location !== undefined) updates.location = location;
  if (start_at !== undefined) updates.start_at = start_at;
  if (end_at !== undefined) updates.end_at = end_at || null;
  if (image_url !== undefined) updates.image_url = image_url || null;
  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("calendar_events")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const userId = (session.user as any).id;

  const { data: existing } = await supabaseAdmin
    .from("calendar_events")
    .select("author_id")
    .eq("id", id)
    .single();

  if (!existing || existing.author_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from("calendar_events")
    .delete()
    .eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
