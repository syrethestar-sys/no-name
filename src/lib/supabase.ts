import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const VIDEO_BUCKET = 'videos';
export const MAX_VIDEO_BYTES = 50_000_000; // matches the bucket limit ("50MB" = 50,000,000 bytes)
export const VIDEO_TYPES = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
} as const;
export type VideoContentType = keyof typeof VIDEO_TYPES;
/** The speech-only copy the browser makes for transcription (Opus in webm). */
export const AUDIO_CONTENT_TYPE = 'audio/webm';
export const newAudioPath = (fileId: string) => `audio/${fileId}.webm`;
export const AUDIO_PATH_PATTERN =
  /^audio\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.webm$/;

/** How long a viewer's signed playback / thumbnail URL stays valid. */
export const SIGNED_URL_SECONDS = 60 * 60;

let storageClient: SupabaseClient | undefined;

/** Server-only Supabase client (service role). Only used for Storage — the DB goes through Drizzle. */
export function getSupabase(): SupabaseClient {
  if (storageClient) return storageClient;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. See .env.example.');
  }

  storageClient = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return storageClient;
}

export function videoStorage() {
  return getSupabase().storage.from(VIDEO_BUCKET);
}
