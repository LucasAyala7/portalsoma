/**
 * Storage de imagens — R2 quando configurado, fallback pra filesystem local.
 *
 * R2 é detectado pela presença de R2_ACCOUNT_ID/KEY/SECRET. Se não tiver,
 * salva em IMAGE_LOCAL_DIR (default outputs/images/) e retorna URL relativa
 * (IMAGE_LOCAL_PUBLIC_URL). Útil em dev local sem R2.
 */

import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { writeFile, mkdir, access } from "node:fs/promises";
import { dirname, resolve, isAbsolute } from "node:path";

let _client: S3Client | null = null;

function r2Configured(): boolean {
  return !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY);
}

function client(): S3Client {
  if (_client) return _client;
  const accountId = process.env.R2_ACCOUNT_ID!;
  const accessKey = process.env.R2_ACCESS_KEY_ID!;
  const secret = process.env.R2_SECRET_ACCESS_KEY!;
  _client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secret },
  });
  return _client;
}

const BUCKET = process.env.R2_BUCKET ?? "portalsoma-media";
const PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "https://media.portalsoma.com.br";
const LOCAL_DIR = process.env.IMAGE_LOCAL_DIR ?? "outputs/images";
const LOCAL_PUBLIC = process.env.IMAGE_LOCAL_PUBLIC_URL ?? "/static/images";

export interface UploadResult {
  key: string;
  url: string;
  storage: "r2" | "local";
}

export async function uploadBuffer(input: {
  key: string;
  buffer: Buffer;
  contentType: string;
  cacheControl?: string;
}): Promise<UploadResult> {
  if (r2Configured()) {
    await client().send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: input.key,
        Body: input.buffer,
        ContentType: input.contentType,
        CacheControl: input.cacheControl ?? "public, max-age=31536000, immutable",
      }),
    );
    return { key: input.key, url: `${PUBLIC_URL}/${input.key}`, storage: "r2" };
  }

  // Fallback local: salva em IMAGE_LOCAL_DIR (resolve relativo a WORKSPACE_ROOT se for path relativo)
  const baseDir = isAbsolute(LOCAL_DIR)
    ? LOCAL_DIR
    : resolve(process.env.WORKSPACE_ROOT ?? process.cwd(), LOCAL_DIR);
  const fullPath = resolve(baseDir, input.key);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, input.buffer);
  return { key: input.key, url: `${LOCAL_PUBLIC}/${input.key}`, storage: "local" };
}

export async function exists(key: string): Promise<boolean> {
  if (r2Configured()) {
    try {
      await client().send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
      return true;
    } catch {
      return false;
    }
  }
  const baseDir = isAbsolute(LOCAL_DIR)
    ? LOCAL_DIR
    : resolve(process.env.WORKSPACE_ROOT ?? process.cwd(), LOCAL_DIR);
  try {
    await access(resolve(baseDir, key));
    return true;
  } catch {
    return false;
  }
}
