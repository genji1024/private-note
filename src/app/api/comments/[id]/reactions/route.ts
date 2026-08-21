import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { commentReactions, reactionTypes } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const reactions = await getDb()
      .select({
        id: commentReactions.id,
        comment_id: commentReactions.comment_id,
        user_id: commentReactions.user_id,
        reaction_type_id: commentReactions.reaction_type_id,
        created_at: commentReactions.created_at,
      })
      .from(commentReactions)
      .where(eq(commentReactions.comment_id, params.id));

    const types = await getDb()
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

    return NextResponse.json({
      reactions: reactions || [],
      types: types || [],
    });
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
  const { reaction_type_id } = await request.json();

  try {
    const rows = await getDb()
      .insert(commentReactions)
      .values({
        comment_id: params.id,
        user_id: userId,
        reaction_type_id,
      })
      .onConflictDoUpdate({
        target: [commentReactions.comment_id, commentReactions.user_id],
        set: { reaction_type_id },
      })
      .returning({
        id: commentReactions.id,
        comment_id: commentReactions.comment_id,
        user_id: commentReactions.user_id,
        reaction_type_id: commentReactions.reaction_type_id,
        created_at: commentReactions.created_at,
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
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
  }

  const userId = (session.user as any).id as string;

  try {
    await getDb()
      .delete(commentReactions)
      .where(
        and(
          eq(commentReactions.comment_id, params.id),
          eq(commentReactions.user_id, userId)
        )
      );
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
