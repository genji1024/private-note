import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { todoItems } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  try {
    const rows = await getDb()
      .select({
        id: todoItems.id,
        todo_list_id: todoItems.todo_list_id,
        title: todoItems.title,
        done: todoItems.done,
        done_by: todoItems.done_by,
        done_at: todoItems.done_at,
        created_by: todoItems.created_by,
        created_at: todoItems.created_at,
        updated_at: todoItems.updated_at,
      })
      .from(todoItems)
      .where(eq(todoItems.todo_list_id, params.id))
      .orderBy(asc(todoItems.created_at));

    return NextResponse.json(rows || []);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(
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

  try {
    const rows = await getDb()
      .insert(todoItems)
      .values({
        todo_list_id: params.id,
        title: body.title.trim(),
        created_by: userId,
      })
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

    return NextResponse.json(rows[0] ?? null, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
