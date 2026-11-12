import 'server-only';
import { isR2Configured, MAX_R2_VIDEO_BYTES, r2Delete, r2Download, r2DownloadUrl } from '@/lib/r2';
import { MAX_VIDEO_BYTES, videoStorage } from '@/lib/supabase';
import type { Video } from '@/types/db';

// Video files live on Supabase (older, up to 50 MB) or R2 (newer, up to 2 GB).
// Thumbnails and speech audio always stay on Supabase.
type StoredVideo = Pick<Video, 'storageProvider' | 'storagePath'>;

/** Where new uploads go: R2 once its keys are set (up to 2 GB), else Supabase (up to 50 MB). */
export function uploadTarget(): { storageProvider: Video['storageProvider']; maxBytes: number } {
  return isR2Configured()
    ? { storageProvider: 'r2', maxBytes: MAX_R2_VIDEO_BYTES }
    : { storageProvider: 'supabase', maxBytes: MAX_VIDEO_BYTES };
}

/** Signed playback link, valid for `seconds`. */
export async function videoPlaybackUrl(video: StoredVideo, seconds: number): Promise<string> {
  if (video.storageProvider === 'r2') return r2DownloadUrl(video.storagePath, seconds);
  const { data, error } = await videoStorage().createSignedUrl(video.storagePath, seconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function downloadVideoFile(video: StoredVideo): Promise<Blob> {
  if (video.storageProvider === 'r2') return r2Download(video.storagePath);
  const { data, error } = await videoStorage().download(video.storagePath);
  if (error) throw error;
  return data;
}

export async function deleteVideoFile(video: StoredVideo): Promise<void> {
  if (video.storageProvider === 'r2') return r2Delete(video.storagePath);
  const { error } = await videoStorage().remove([video.storagePath]);
  if (error) throw error;
}
