import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { display_name, profile_image_url, new_password } = await req.json();
  const userId = (session.user as any).id;

  // Build update object
  const update: Record<string, string> = {};
  if (display_name !== undefined) update.display_name = display_name;
  if (profile_image_url !== undefined) update.profile_image_url = profile_image_url;

  // Update profile fields
  if (Object.keys(update).length > 0) {
    const { error } = await supabaseAdmin
      .from("users")
      .update(update)
      .eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update password if provided
  if (new_password) {
    const { error: rpcError } = await supabaseAdmin.rpc("update_password", {
      p_user_id: userId,
      p_new_password: new_password,
    });
    if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
