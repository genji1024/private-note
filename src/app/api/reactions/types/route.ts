import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { reactionTypes } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await getDb()
      .select({
        id: reactionTypes.id,
        type: reactionTypes.type,
        value: reactionTypes.value,
        label: reactionTypes.label,
        sort_order: reactionTypes.sort_order,
        created_at: reactionTypes.created_at,
      })
      .from(reactionTypes)
      .orderBy(asc(reactionTypes.sort_order));

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

  const username = (session.user as any).username as string;
  if (username !== "genji") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.type || !body.value) {
    return NextResponse.json(
      { error: "type と value は必須です" },
      { status: 400 }
    );
  }

  try {
    const rows = await getDb()
      .insert(reactionTypes)
      .values({
        type: body.type,
        value: body.value,
        label: body.label || "",
        sort_order: body.sort_order || 0,
      })
      .returning({
        id: reactionTypes.id,
        type: reactionTypes.type,
        value: reactionTypes.value,
        label: reactionTypes.label,
        sort_order: reactionTypes.sort_order,
        created_at: reactionTypes.created_at,
      });

    return NextResponse.json(rows[0] ?? null);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const username = (session.user as any).username as string;
  if (username !== "genji") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const body = await request.json();
  if (!body.id) {
    return NextResponse.json({ error: "id は必須です" }, { status: 400 });
  }

  const updates: Partial<typeof reactionTypes.$inferInsert> = {};
  if (body.type) updates.type = body.type;
  if (body.value) updates.value = body.value;
  if (body.label !== undefined) updates.label = body.label;
  if (body.sort_order !== undefined) updates.sort_order = body.sort_order;

  try {
    const rows = await getDb()
      .update(reactionTypes)
      .set(updates)
      .where(eq(reactionTypes.id, body.id))
      .returning({
        id: reactionTypes.id,
        type: reactionTypes.type,
        value: reactionTypes.value,
        label: reactionTypes.label,
        sort_order: reactionTypes.sort_order,
        created_at: reactionTypes.created_at,
      });

    return NextResponse.json(rows[0] ?? null);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const username = (session.user as any).username as string;
  if (username !== "genji") {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "id は必須です" }, { status: 400 });
  }

  try {
    await getDb().delete(reactionTypes).where(eq(reactionTypes.id, id));
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
