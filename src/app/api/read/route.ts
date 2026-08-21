import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { commentReadStatus } from "@/db/schema";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { comment_id } = await req.json();
  const readerId = (session.user as any).id;

  try {
    await getDb()
      .insert(commentReadStatus)
      .values({ comment_id, reader_id: readerId })
      .onConflictDoNothing();
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
