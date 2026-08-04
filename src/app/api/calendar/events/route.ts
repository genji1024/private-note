import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: eventsData, error: eventsError } = await supabaseAdmin
    .from("calendar_events")
    .select("*")
    .order("start_at", { ascending: true });
  if (eventsError)
    return NextResponse.json({ error: eventsError.message }, { status: 500 });
  const { data: exceptionsData, error: exceptionsError } = await supabaseAdmin
    .from("calendar_event_exceptions")
    .select("*");
  if (exceptionsError)
    return NextResponse.json(
      { error: exceptionsError.message },
      { status: 500 }
    );
  return NextResponse.json({
    events: eventsData,
    exceptions: exceptionsData || [],
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { title, location, start_at, end_at, image_url, recurrence_rule } =
    await req.json();
  const authorId = (session.user as any).id;
  if (!title || !start_at)
    return NextResponse.json(
      { error: "title and start_at are required" },
      { status: 400 }
    );
  const { data, error } = await supabaseAdmin
    .from("calendar_events")
    .insert({
      author_id: authorId,
      title,
      location: location || "",
      start_at,
      end_at: end_at || null,
      image_url: image_url || null,
      recurrence_rule: recurrence_rule || null,
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
  const { id, title, location, start_at, end_at, image_url, recurrence_rule } =
    await req.json();
  const userId = (session.user as any).id;
  if (!id)
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  const { data: existing } = await supabaseAdmin
    .from("calendar_events")
    .select("author_id")
    .eq("id", id)
    .single();
  if (!existing || existing.author_id !== userId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (location !== undefined) updates.location = location;
  if (start_at !== undefined) updates.start_at = start_at;
  if (end_at !== undefined) updates.end_at = end_at || null;
  if (image_url !== undefined) updates.image_url = image_url || null;
  if (recurrence_rule !== undefined)
    updates.recurrence_rule = recurrence_rule || null;
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
  const { id, delete_mode, occurrence_date } = await req.json();
  const userId = (session.user as any).id;
  const { data: existing } = await supabaseAdmin
    .from("calendar_events")
    .select("author_id, recurrence_rule")
    .eq("id", id)
    .single();
  if (!existing || existing.author_id !== userId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (delete_mode === "single" && occurrence_date) {
    const { error } = await supabaseAdmin
      .from("calendar_event_exceptions")
      .insert({ event_id: id, exception_date: occurrence_date });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  if (delete_mode === "future" && occurrence_date) {
    try {
      const rule = existing.recurrence_rule
        ? JSON.parse(existing.recurrence_rule)
        : null;
      if (rule) {
        rule.until = occurrence_date;
        const { error } = await supabaseAdmin
          .from("calendar_events")
          .update({
            recurrence_rule: JSON.stringify(rule),
            updated_at: new Date().toISOString(),
          })
          .eq("id", id);
        if (error)
          return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid recurrence rule" },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true });
  }
  const { error } = await supabaseAdmin
    .from("calendar_events")
    .delete()
    .eq("id", id);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
