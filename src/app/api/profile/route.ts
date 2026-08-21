import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/db/schema";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { display_name, profile_image_url, new_password } = await req.json();
  const userId = (session.user as any).id;

  // Build update object (keys are Drizzle column property names)
  const update: { display_name?: string; profile_image_url?: string } = {};
  if (display_name !== undefined) update.display_name = display_name;
  if (profile_image_url !== undefined)
    update.profile_image_url = profile_image_url;

  // Update profile fields
  if (Object.keys(update).length > 0) {
    try {
      await getDb().update(users).set(update).where(eq(users.id, userId));
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 500 }
      );
    }
  }

  // Update password if provided
  if (new_password) {
    try {
      await getDb().execute(
        sql`select update_password(${userId}, ${new_password})`
      );
    } catch (err) {
      return NextResponse.json(
        { error: (err as Error).message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
