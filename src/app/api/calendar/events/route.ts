import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { calendarEventExceptions, calendarEvents } from "@/db/schema";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const eventsData = await getDb()
      .select({
        id: calendarEvents.id,
        author_id: calendarEvents.author_id,
        title: calendarEvents.title,
        location: calendarEvents.location,
        start_at: calendarEvents.start_at,
        end_at: calendarEvents.end_at,
        image_url: calendarEvents.image_url,
        recurrence_rule: calendarEvents.recurrence_rule,
        created_at: calendarEvents.created_at,
        updated_at: calendarEvents.updated_at,
      })
      .from(calendarEvents)
      .orderBy(asc(calendarEvents.start_at));

    const exceptionsData = await getDb()
      .select({
        id: calendarEventExceptions.id,
        event_id: calendarEventExceptions.event_id,
        exception_date: calendarEventExceptions.exception_date,
        created_at: calendarEventExceptions.created_at,
      })
      .from(calendarEventExceptions);
    return NextResponse.json({
      events: eventsData,
      exceptions: exceptionsData || [],
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
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
  try {
    const rows = await getDb()
      .insert(calendarEvents)
      .values({
        author_id: authorId,
        title,
        location: location || "",
        start_at,
        end_at: end_at || null,
        image_url: image_url || null,
        recurrence_rule: recurrence_rule || null,
      })
      .returning({
        id: calendarEvents.id,
        author_id: calendarEvents.author_id,
        title: calendarEvents.title,
        location: calendarEvents.location,
        start_at: calendarEvents.start_at,
        end_at: calendarEvents.end_at,
        image_url: calendarEvents.image_url,
        recurrence_rule: calendarEvents.recurrence_rule,
        created_at: calendarEvents.created_at,
        updated_at: calendarEvents.updated_at,
      });
    return NextResponse.json(rows[0] ?? null);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
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
  const existingRows = await getDb()
    .select({ author_id: calendarEvents.author_id })
    .from(calendarEvents)
    .where(eq(calendarEvents.id, id))
    .limit(1);
  const existing = existingRows[0];
  if (!existing || existing.author_id !== userId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const updates: Partial<typeof calendarEvents.$inferInsert> = {};
  if (title !== undefined) updates.title = title;
  if (location !== undefined) updates.location = location;
  if (start_at !== undefined) updates.start_at = start_at;
  if (end_at !== undefined) updates.end_at = end_at || null;
  if (image_url !== undefined) updates.image_url = image_url || null;
  if (recurrence_rule !== undefined)
    updates.recurrence_rule = recurrence_rule || null;
  updates.updated_at = new Date();
  try {
    const rows = await getDb()
      .update(calendarEvents)
      .set(updates)
      .where(eq(calendarEvents.id, id))
      .returning({
        id: calendarEvents.id,
        author_id: calendarEvents.author_id,
        title: calendarEvents.title,
        location: calendarEvents.location,
        start_at: calendarEvents.start_at,
        end_at: calendarEvents.end_at,
        image_url: calendarEvents.image_url,
        recurrence_rule: calendarEvents.recurrence_rule,
        created_at: calendarEvents.created_at,
        updated_at: calendarEvents.updated_at,
      });
    return NextResponse.json(rows[0] ?? null);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, delete_mode, occurrence_date } = await req.json();
  const userId = (session.user as any).id;
  const existingRows = await getDb()
    .select({
      author_id: calendarEvents.author_id,
      recurrence_rule: calendarEvents.recurrence_rule,
    })
    .from(calendarEvents)
    .where(eq(calendarEvents.id, id))
    .limit(1);
  const existing = existingRows[0];
  if (!existing || existing.author_id !== userId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (delete_mode === "single" && occurrence_date) {
    try {
      await getDb()
        .insert(calendarEventExceptions)
        .values({ event_id: id, exception_date: occurrence_date });
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true });
  }
  if (delete_mode === "future" && occurrence_date) {
    try {
      const rule = existing.recurrence_rule
        ? JSON.parse(existing.recurrence_rule)
        : null;
      if (rule) {
        rule.until = occurrence_date;
        await getDb()
          .update(calendarEvents)
          .set({
            recurrence_rule: JSON.stringify(rule),
            updated_at: new Date(),
          })
          .where(eq(calendarEvents.id, id));
      }
    } catch (err) {
      if ((err as Error).message.includes("Unexpected")) {
        return NextResponse.json(
          { error: "Invalid recurrence rule" },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true });
  }
  try {
    await getDb().delete(calendarEvents).where(eq(calendarEvents.id, id));
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
