import { Service } from 'typedi';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../utils/env';

export type PresignPutParams = {
  key?: string; // if not provided, a random key will be generated
  contentType?: string; // defaults to 'image/jpeg'
  expiresInSeconds?: number; // default 900 (15 min)
  acl?: 'private' | 'public-read';
};

export type PresignGetParams = {
  key: string;
  expiresInSeconds?: number; // default 900 (15 min)
  responseContentType?: string;
};

@Service()
export class S3Helper {
  private readonly s3: S3Client;
  private readonly bucket?: string;

  constructor() {
    if (!env.AWS_REGION) {
      throw new Error('AWS_REGION is not configured');
    }
    this.s3 = new S3Client({ region: env.AWS_REGION });
    this.bucket = env.S3_BUCKET;
  }

  private ensureBucket() {
    const b = this.bucket;
    if (!b) throw new Error('S3 bucket not specified (S3_BUCKET)');
    return b;
  }

  private inferExtFromContentType(ct: string): string | undefined {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'video/mp4': 'mp4',
      'application/pdf': 'pdf',
    };
    return map[ct];
  }

  private generateRandomKey(contentType: string): string {
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 10);
    const ext = this.inferExtFromContentType(contentType);
    return ext ? `${ts}-${rand}.${ext}` : `${ts}-${rand}`;
  }

  async presignPut(params: PresignPutParams) {
    const { key, contentType = 'image/jpeg', expiresInSeconds = 900, acl = 'private' } = params;
    const Bucket = this.ensureBucket();
    const objectKey = key && key.trim().length > 0 ? key : this.generateRandomKey(contentType);

    // Any headers included here must be provided by the client when uploading.
    const cmd = new PutObjectCommand({
      Bucket,
      Key: objectKey,
      ContentType: contentType,
      ACL: acl,
    });

    const url = await getSignedUrl(this.s3, cmd, { expiresIn: expiresInSeconds });

    const headers: Record<string, string> = {
      'Content-Type': contentType,
    };
    if (acl) headers['x-amz-acl'] = acl;

    return { url, method: 'PUT' as const, headers, bucket: Bucket, key: objectKey };
  }

  async presignGet(params: PresignGetParams) {
    const { key, expiresInSeconds = 900, responseContentType } = params;
    const Bucket = this.ensureBucket();
    const cmd = new GetObjectCommand({ Bucket, Key: key, ResponseContentType: responseContentType });
    const url = await getSignedUrl(this.s3, cmd, { expiresIn: expiresInSeconds });
    return { url, bucket: Bucket, key };
  }
}

