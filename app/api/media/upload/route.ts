import { NextResponse, type NextRequest } from "next/server";
import { r2PutObject, buildMediaKey } from "@/lib/r2";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/pdf",
]);

function mediaTypeFor(mime: string): "IMAGE" | "VIDEO" | "DOC" {
  if (mime.startsWith("video/")) return "VIDEO";
  if (mime === "application/pdf") return "DOC";
  return "IMAGE";
}

/**
 * Server-side media upload → Cloudflare R2 + MediaAsset record.
 * SECURITY: admin authentication & `media.write` permission are enforced
 * in Phase 14 (auth). This endpoint is used only by the admin UI.
 */
export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  const folder = (form.get("folder") as string | null) ?? "uploads";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File exceeds 25 MB limit" },
      { status: 413 },
    );
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported type: ${file.type}` },
      { status: 415 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = buildMediaKey(folder, file.name);
    const { url } = await r2PutObject({
      key,
      body: buffer,
      contentType: file.type,
    });

    const asset = await prisma.mediaAsset.create({
      data: {
        r2Key: key,
        url,
        type: mediaTypeFor(file.type),
        mimeType: file.type,
        sizeBytes: file.size,
        folder,
      },
    });

    return NextResponse.json({
      id: asset.id,
      key,
      url,
      type: asset.type,
    });
  } catch (err) {
    console.error("R2 upload failed:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
