import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import {
  MAX_IMAGE_SIZE_BYTES,
  IMAGE_SIZE_ERROR_MESSAGE,
  validateImageBytes,
  UPLOAD_READ_ERROR_MESSAGE,
  UPLOAD_SAVE_ERROR_MESSAGE,
} from "@/lib/imageValidation";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let file: File | null = null;
  try {
    const formData = await req.formData();
    file = formData.get("file") as File | null;
  } catch {
    return NextResponse.json(
      { error: UPLOAD_READ_ERROR_MESSAGE },
      { status: 400 }
    );
  }

  if (!file)
    return NextResponse.json(
      { error: "ファイルが指定されていません。" },
      { status: 400 }
    );

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json(
      { error: IMAGE_SIZE_ERROR_MESSAGE },
      { status: 400 }
    );
  }

  let bytes: Uint8Array;
  try {
    const arrayBuffer = await file.arrayBuffer();
    bytes = new Uint8Array(arrayBuffer);
  } catch {
    return NextResponse.json(
      { error: UPLOAD_READ_ERROR_MESSAGE },
      { status: 400 }
    );
  }

  const result = validateImageBytes({ bytes, size: file.size });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const userId = (session.user as { id: string }).id;
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${result.extension}`;

  try {
    const { error } = await supabaseAdmin.storage
      .from("images")
      .upload(fileName, bytes, { contentType: result.mimeType });

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Supabase storage upload failed:", error);
      return NextResponse.json(
        { error: error.message || UPLOAD_SAVE_ERROR_MESSAGE },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("images")
      .getPublicUrl(fileName);

    return NextResponse.json({ url: urlData.publicUrl, path: fileName });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Image upload failed:", err);
    return NextResponse.json(
      { error: UPLOAD_SAVE_ERROR_MESSAGE },
      { status: 500 }
    );
  }
}
