import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";

const s3Client = new S3Client({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

interface CreateUploadUrlSchema {
  filename: string;
  contentType: string;
}

interface CreateUploadUrlResponse {
  signedUrl: string;
  fields: Record<string, string>;
}

export async function createPresignedPostUrl(
  file: CreateUploadUrlSchema
): Promise<CreateUploadUrlResponse> {
  const { url, fields } = await createPresignedPost(s3Client, {
    Bucket: env.S3_BUCKET!,
    Key: `${file.filename}`,
    Conditions: [
      ["content-length-range", 0, mbToBytes(10)],
      ["starts-with", "$Content-Type", file.contentType],
    ],
    Fields: {
      "Content-Type": file.contentType,
    },
    Expires: 600,
  });

  return { signedUrl: url, fields };
}

export async function createPresignedGetUrl(path: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET!,
    Key: path,
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

  return url;
}

function mbToBytes(mb: number) {
  return mb * 1024 * 1024;
}
