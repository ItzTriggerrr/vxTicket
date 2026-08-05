// app/api/storage/upload/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Enforce configuration constants to block resource abuse
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // Strict 5MB Limit Allocation

// Initialise an isolated connection instance channel using root token values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder_key";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("asset_file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "Missing required binary stream resource payload" }, { status: 400 });
    }

    // 🛡️ SECURITY SHIELD 1: Enforce hard binary allocation boundaries
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ success: false, error: "Payload volume exceeds allocation parameters. Max 5MB." }, { status: 413 });
    }

    // 🛡️ SECURITY SHIELD 2: Enforce strict structural file extension verification checks
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Unsupported document encoding signature. Formats permitted: JPEG, PNG, WEBP." }, { status: 415 });
    }

    // Generate an unguessable unique string filename tracking node reference path
    const fileExtension = file.type.split("/")[1];
    const randomizedPathId = `${crypto.randomUUID()}.${fileExtension}`;

    // Read file binary array parameters stream raw data array blocks directly into memory buffer spaces
    const binaryDataArrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(binaryDataArrayBuffer);

    // Push the raw image vector data straight onto distributed global CDN cloud buckets
    const { data: uploadNode, error: storageError } = await supabase.storage
      .from("saas-listings-media")
      .upload(randomizedPathId, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (storageError) {
      throw storageError;
    }

    // Retrieve the public edge access URL link layout destination point
    const { data: publicUrlNode } = supabase.storage
      .from("saas-listings-media")
      .getPublicUrl(randomizedPathId);

    return NextResponse.json({
      success: true,
      cdnUrl: publicUrlNode.publicUrl
    }, { status: 201 });

  } catch (error) {
    console.error("Cloud Asset Storage Uplink Routine Exception Aborted:", error);
    return NextResponse.json({ success: false, error: "Infrastructure network routing pipe terminal failure" }, { status: 500 });
  }
}