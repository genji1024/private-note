import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { todoLists } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  try {
    const rows = await getDb()
      .select({
        id: todoLists.id,
        title: todoLists.title,
        created_by: todoLists.created_by,
        created_at: todoLists.created_at,
        updated_at: todoLists.updated_at,
      })
      .from(todoLists)
      .orderBy(asc(todoLists.created_at));

    return NextResponse.json(rows || []);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
      .insert(todoLists)
      .values({ title: body.title.trim(), created_by: userId })
      .returning({
        id: todoLists.id,
        title: todoLists.title,
        created_by: todoLists.created_by,
        created_at: todoLists.created_at,
        updated_at: todoLists.updated_at,
      });

    return NextResponse.json(rows[0] ?? null, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
