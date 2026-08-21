import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { threads } from "@/db/schema";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await getDb().execute(sql`select * from get_threads()`);
    // get_threads returns comment_count as bigint; Supabase/PostgREST exposed
    // it as a JSON number, while node-postgres returns the raw value as a
    // string. Normalize it back to a number to keep the exact response shape.
    const data = (result.rows as Record<string, unknown>[]).map((row) => ({
      ...row,
      comment_count: Number(row.comment_count),
    }));
    return NextResponse.json(data);
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

  const { title, description } = await req.json();
  const createdBy = (session.user as any).id;

  try {
    await getDb()
      .insert(threads)
      .values({
        title,
        description: description || "",
        created_by: createdBy,
      });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, description } = await req.json();

  try {
    await getDb()
      .update(threads)
      .set({ description: description || "" })
      .where(eq(threads.id, id));
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const userId = (session.user as any).id;

  const rows = await getDb()
    .select({
      created_by: threads.created_by,
      is_default: threads.is_default,
    })
    .from(threads)
    .where(eq(threads.id, id))
    .limit(1);
  const thread = rows[0];

  if (!thread || thread.created_by !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (thread.is_default) {
    return NextResponse.json(
      { error: "Default threads cannot be deleted" },
      { status: 403 }
    );
  }

  try {
    await getDb().delete(threads).where(eq(threads.id, id));
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
