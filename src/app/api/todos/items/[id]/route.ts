import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { todoItems } from "@/db/schema";

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
  const updates: Record<string, any> = {
    updated_at: new Date(),
  };

  if (typeof body.title === "string" && body.title.trim()) {
    updates.title = body.title.trim();
  }
  if (typeof body.done === "boolean") {
    updates.done = body.done;
    if (body.done) {
      updates.done_by = userId;
      updates.done_at = new Date();
    } else {
      updates.done_by = null;
      updates.done_at = null;
    }
  }

  try {
    const rows = await getDb()
      .update(todoItems)
      .set(updates)
      .where(eq(todoItems.id, params.id))
      .returning({
        id: todoItems.id,
        todo_list_id: todoItems.todo_list_id,
        title: todoItems.title,
        done: todoItems.done,
        done_by: todoItems.done_by,
        done_at: todoItems.done_at,
        created_by: todoItems.created_by,
        created_at: todoItems.created_at,
        updated_at: todoItems.updated_at,
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

  const itemRows = await getDb()
    .select({ created_by: todoItems.created_by })
    .from(todoItems)
    .where(eq(todoItems.id, params.id))
    .limit(1);
  const item = itemRows[0];

  if (!item) {
    return NextResponse.json(
      { error: "項目が見つかりません" },
      { status: 404 }
    );
  }
  if (item.created_by !== userId) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  try {
    await getDb().delete(todoItems).where(eq(todoItems.id, params.id));
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
