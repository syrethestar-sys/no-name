import 'server-only';
import { AwsClient } from 'aws4fetch';

/** Per-file cap for videos on R2 (the free tier holds 10 GB in total). */
export const MAX_R2_VIDEO_BYTES = 2_000_000_000;
const UPLOAD_LINK_SECONDS = 60 * 60; // a 2 GB upload on a slow line can take a while

type R2 = { client: AwsClient; bucketUrl: string };
let r2: R2 | undefined;

/** True when all R2 keys are set; uploads fall back to Supabase (50 MB) otherwise. */
export function isR2Configured(): boolean {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  return Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET);
}

function getR2(): R2 {
  if (r2) return r2;
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    throw new Error(
      'R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY or R2_BUCKET is not set.',
    );
  }
  r2 = {
    client: new AwsClient({
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
      service: 's3',
      region: 'auto',
    }),
    bucketUrl: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}`,
  };
  return r2;
}

const objectUrl = (key: string) =>
  `${getR2().bucketUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;

/** A link that works without our keys for `seconds` (query-string signature). */
async function presign(key: string, method: 'GET' | 'PUT', seconds: number): Promise<string> {
  const url = new URL(objectUrl(key));
  url.searchParams.set('X-Amz-Expires', String(seconds));
  const signed = await getR2().client.sign(new Request(url, { method }), {
    aws: { signQuery: true },
  });
  return signed.url;
}

/** For the owner's browser to PUT the file straight to R2. */
export const r2UploadUrl = (key: string) => presign(key, 'PUT', UPLOAD_LINK_SECONDS);

/** For playback; the bucket is private, so this link is the only way in. */
export const r2DownloadUrl = (key: string, seconds: number) => presign(key, 'GET', seconds);

export async function r2Download(key: string): Promise<Blob> {
  const response = await getR2().client.fetch(objectUrl(key));
  if (!response.ok) throw new Error(`R2 download failed with status ${response.status}`);
  return response.blob();
}

export async function r2Delete(key: string): Promise<void> {
  const response = await getR2().client.fetch(objectUrl(key), { method: 'DELETE' });
  // 404: already gone, which is what we wanted.
  if (!response.ok && response.status !== 404) {
    throw new Error(`R2 delete failed with status ${response.status}`);
  }
}
