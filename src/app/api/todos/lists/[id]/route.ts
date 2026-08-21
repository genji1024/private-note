import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { todoLists } from "@/db/schema";

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

  const listRows = await getDb()
    .select({ created_by: todoLists.created_by })
    .from(todoLists)
    .where(eq(todoLists.id, params.id))
    .limit(1);
  const list = listRows[0];

  if (!list) {
    return NextResponse.json(
      { error: "リストが見つかりません" },
      { status: 404 }
    );
  }
  if (list.created_by !== userId) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  try {
    const rows = await getDb()
      .update(todoLists)
      .set({ title: body.title.trim(), updated_at: new Date() })
      .where(eq(todoLists.id, params.id))
      .returning({
        id: todoLists.id,
        title: todoLists.title,
        created_by: todoLists.created_by,
        created_at: todoLists.created_at,
        updated_at: todoLists.updated_at,
      });

    return NextResponse.json(rows[0] ?? null);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
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

  const listRows = await getDb()
    .select({ created_by: todoLists.created_by })
    .from(todoLists)
    .where(eq(todoLists.id, params.id))
    .limit(1);
  const list = listRows[0];

  if (!list) {
    return NextResponse.json(
      { error: "リストが見つかりません" },
      { status: 404 }
    );
  }
  if (list.created_by !== userId) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  try {
    await getDb().delete(todoLists).where(eq(todoLists.id, params.id));
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
