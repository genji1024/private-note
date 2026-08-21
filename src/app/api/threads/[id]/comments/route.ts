import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { threadComments } from "@/db/schema";
import { notifyOtherUsers } from "@/lib/push";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await getDb().execute(
      sql`select * from get_thread_comments(${params.id})`
    );
    return NextResponse.json(result.rows);
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

  const { thread_id, title, body, image_url } = await req.json();
  const authorId = (session.user as any).id;

  try {
    await getDb()
      .insert(threadComments)
      .values({
        thread_id,
        author_id: authorId,
        title: title || "",
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
    title: "新しいコメントが投稿されました",
    body: body?.slice(0, 80) || "コメント",
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
    .select({ author_id: threadComments.author_id })
    .from(threadComments)
    .where(eq(threadComments.id, id))
    .limit(1);
  const comment = rows[0];

  if (!comment || comment.author_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await getDb()
      .update(threadComments)
      .set({
        title: title || "",
        body,
        image_url,
        updated_at: new Date(),
      })
      .where(eq(threadComments.id, id));
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
    .select({ author_id: threadComments.author_id })
    .from(threadComments)
    .where(eq(threadComments.id, id))
    .limit(1);
  const comment = rows[0];

  if (!comment || comment.author_id !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await getDb().delete(threadComments).where(eq(threadComments.id, id));
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
