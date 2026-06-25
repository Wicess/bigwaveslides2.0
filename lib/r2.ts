// lib/r2.ts
// -----------------------------------------------------------------------------
// Storage helpers for Cloudflare R2 — where all of the site's images and videos
// live (we never serve media from the local /public folder). R2 speaks the same
// API as Amazon S3, so we reuse the official AWS S3 SDK but point it at R2's
// servers. This module:
//   - creates a configured client (`r2`),
//   - turns a stored "key" (file path inside the bucket) into a public CDN URL,
//   - builds safe, unique file names (keys),
//   - uploads / deletes files,
//   - and creates short-lived "presigned" URLs so a browser can upload directly.
// Used by server-side upload/admin code only.
// -----------------------------------------------------------------------------

// "server-only" makes the build fail if this file is ever imported into
// client/browser code. That protects the secret credentials below from leaking.
import "server-only";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// All configuration comes from environment variables (set in .env.local), so
// no secrets are hard-coded. R2's API endpoint is per-account; if R2_ENDPOINT
// isn't set explicitly we build the standard URL from the account id.
const accountId = process.env.R2_ACCOUNT_ID;
const endpoint =
  process.env.R2_ENDPOINT ??
  (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

// The bucket (top-level container) that holds our files.
export const R2_BUCKET = process.env.R2_BUCKET_NAME ?? "";
// The public CDN base URL files are served from. We strip any trailing "/" so
// we can safely join it with a key using a single "/" later.
const PUBLIC_BASE = (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, "");

/** S3-compatible client pointed at Cloudflare R2. */
export const r2 = new S3Client({
  // R2 ignores AWS regions, but the SDK requires one; "auto" is the convention.
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

/** Resolve a stored object key (or pass-through full URL) to its public CDN URL. */
export function r2PublicUrl(keyOrUrl: string): string {
  // If we already have a full http(s) URL, return it unchanged.
  if (/^https?:\/\//.test(keyOrUrl)) return keyOrUrl;
  // Otherwise it's a bucket key like "uploads/123-abc-photo.jpg". Strip any
  // leading "/" then join to the CDN base so we never get a double slash.
  return `${PUBLIC_BASE}/${keyOrUrl.replace(/^\//, "")}`;
}

/** Build a collision-resistant, URL-safe object key inside a folder. */
export function buildMediaKey(folder: string, filename: string): string {
  // Sanitize the original filename so it's safe to use in a URL:
  const safe = filename
    .toLowerCase()
    .replace(/[^a-z0-9.\-]+/g, "-") // replace any run of unsafe chars with "-"
    .replace(/-+/g, "-") // collapse multiple dashes into one
    .replace(/^-|-$/g, ""); // trim leading/trailing dashes
  // Normalize the folder (no leading/trailing slashes); default to "uploads".
  const cleanFolder = folder.replace(/(^\/+|\/+$)/g, "") || "uploads";
  // A short random string. Combined with the millisecond timestamp below this
  // makes accidental key collisions effectively impossible even for files
  // uploaded with the same name at nearly the same time.
  const rand = Math.random().toString(36).slice(2, 8);
  return `${cleanFolder}/${Date.now()}-${rand}-${safe}`;
}

/** Upload a buffer to R2 and return its key + public URL. */
export async function r2PutObject(params: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<{ key: string; url: string }> {
  // Send the file bytes (`body`) to R2. ContentType tells browsers how to
  // interpret the file (e.g. "image/jpeg") when it's later served.
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
  // A "presigned URL" is a temporary URL that already contains a signature
  // proving it was authorized by us. We can hand it to the browser so the
  // browser can PUT the file straight to R2 — without the file passing through
  // our server, and without exposing our secret credentials. The matching
  // PutObjectCommand below defines exactly what that URL is allowed to do.
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: params.key,
    ContentType: params.contentType,
  });
  // The URL is only valid for `expiresIn` seconds (default 600 = 10 minutes),
  // after which it stops working — limiting the window for misuse.
  const uploadUrl = await getSignedUrl(r2, command, {
    expiresIn: params.expiresIn ?? 600,
  });
  return { uploadUrl, key: params.key, publicUrl: r2PublicUrl(params.key) };
}

/** Delete an object from R2. */
export async function r2DeleteObject(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}
