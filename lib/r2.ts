import "server-only";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const accountId = process.env.R2_ACCOUNT_ID;
const endpoint =
  process.env.R2_ENDPOINT ??
  (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "";
const PUBLIC_BASE = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

/** S3-compatible client pointed at Cloudflare R2. */
export const r2 = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

/** Resolve a stored object key (or pass-through full URL) to its public CDN URL. */
export function r2PublicUrl(keyOrUrl: string): string {
  if (/^https?:\/\//.test(keyOrUrl)) return keyOrUrl;
  return `${PUBLIC_BASE}/${keyOrUrl.replace(/^\//, "")}`;
}

/** Build a collision-resistant, URL-safe object key inside a folder. */
export function buildMediaKey(folder: string, filename: string): string {
  const safe = filename
    .toLowerCase()
    .replace(/[^a-z0-9.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const cleanFolder = folder.replace(/(^\/+|\/+$)/g, "") || "uploads";
  const rand = Math.random().toString(36).slice(2, 8);
  return `${cleanFolder}/${Date.now()}-${rand}-${safe}`;
}

/** Upload a buffer to R2 and return its key + public URL. */
export async function r2PutObject(params: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<{ key: string; url: string }> {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    }),
  );
  return { key: params.key, url: r2PublicUrl(params.key) };
}

/** Presigned PUT URL for direct browser→R2 uploads (requires bucket CORS). */
export async function r2PresignUpload(params: {
  key: string;
  contentType: string;
  expiresIn?: number;
}): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: params.key,
    ContentType: params.contentType,
  });
  const uploadUrl = await getSignedUrl(r2, command, {
    expiresIn: params.expiresIn ?? 600,
  });
  return { uploadUrl, key: params.key, publicUrl: r2PublicUrl(params.key) };
}

/** Delete an object from R2. */
export async function r2DeleteObject(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}
