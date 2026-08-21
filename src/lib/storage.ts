// MinIO (S3-compatible) object storage helper for private-note.
//
// Lazy-init discipline: nothing is constructed at module import time. The
// S3Client is created on first use (mirroring src/lib/db.ts) so that `next
// build` page-data collection works without storage configured.

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

let s3Client: S3Client | undefined;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      endpoint: process.env.MINIO_ENDPOINT,
      region: process.env.MINIO_REGION ?? "ap-northeast-1",
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || "",
        secretAccessKey: process.env.MINIO_SECRET_KEY || "",
      },
      forcePathStyle: true,
    });
  }
  return s3Client;
}

/**
 * Upload an image object into the configured MinIO bucket.
 * Resolves with `{ key }` on success; rejects (S3 SDK semantics) on failure.
 */
export async function uploadImage(
  key: string,
  body: Uint8Array,
  contentType: string
): Promise<{ key: string }> {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: process.env.MINIO_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return { key };
}

/**
 * Public (browser-accessible) URL for a stored object.
 */
export function getPublicUrl(key: string): string {
  const publicUrl = process.env.MINIO_PUBLIC_URL || "";
  const bucket = process.env.MINIO_BUCKET || "";
  return `${publicUrl}/${bucket}/${key}`;
}
