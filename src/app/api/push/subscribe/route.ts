import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { pushSubscriptions } from "@/db/schema";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint, keys } = await req.json();
  const userId = (session.user as any).id;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json(
      { error: "Invalid subscription" },
      { status: 400 }
    );
  }

  try {
    await getDb()
      .insert(pushSubscriptions)
      .values({
        user_id: userId,
        endpoint,
        keys,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: { user_id: userId, keys },
      });
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

  const { endpoint } = await req.json();
  const userId = (session.user as any).id;

  try {
    await getDb()
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.endpoint, endpoint),
          eq(pushSubscriptions.user_id, userId)
        )
      );
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
