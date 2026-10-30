import "server-only";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "@/lib/r2";

/**
 * Chat attachments in R2, on Splash Republic's existing bucket and client.
 *
 * A customer's photo, a receipt or an invoice sent in the chat is private: it is
 * stored under `private/chat/<thread>/` with a random name, never linked publicly,
 * and opened only through a short-lived signed URL handed out by the chat routes.
 */
export const keys = {
  chatAttachment: (threadId: string, nonce: string, ext: string) =>
    `private/chat/${threadId}/${nonce}.${ext}`,
} as const;

export async function putObject(
  key: string,
  body: Uint8Array | Buffer | string,
  contentType: string,
): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "private, no-store",
    }),
  );
}

/** A short-lived link to a private object. */
export async function signedUrl(
  key: string,
  expiresInSeconds = 300,
): Promise<string> {
  return getSignedUrl(
    r2,
    new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
    {
      expiresIn: expiresInSeconds,
    },
  );
}

export async function deleteObject(key: string): Promise<void> {
  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
}
