import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { entries } from "@/db/schema";
import { notifyOtherUsers } from "@/lib/push";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, body, image_url } = await req.json();
  const authorId = (session.user as any).id;

  try {
    await getDb()
      .insert(entries)
      .values({
        author_id: authorId,
        title,
        body,
        image_url: image_url || null,
      });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }

  await notifyOtherUsers({
    authorId,
    title: "新しい日記が投稿されました",
    body: title || body?.slice(0, 80) || "日記",
    url: "/",
  });

  return NextResponse.json({ ok: true });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, title, body, image_url } = await req.json();
  const userId = (session.user as any).id;

  const rows = await getDb()
    .select({ author_id: entries.author_id })
    .from(entries)
    .where(eq(entries.id, id))
    .limit(1);
  const entry = rows[0];

  if (!entry || entry.author_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await getDb()
      .update(entries)
      .set({ title, body, image_url, updated_at: new Date() })
      .where(eq(entries.id, id));
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
    .select({ author_id: entries.author_id })
    .from(entries)
    .where(eq(entries.id, id))
    .limit(1);
  const entry = rows[0];

  if (!entry || entry.author_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await getDb().delete(entries).where(eq(entries.id, id));
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
