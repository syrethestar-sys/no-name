import 'server-only';
import { r2Delete, r2Download, r2DownloadUrl } from '@/lib/r2';
import { videoStorage } from '@/lib/supabase';
import type { Video } from '@/types/db';

// Video files live on Supabase (older, up to 50 MB) or R2 (newer, up to 2 GB).
// Thumbnails and speech audio always stay on Supabase.
type StoredVideo = Pick<Video, 'storageProvider' | 'storagePath'>;

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
