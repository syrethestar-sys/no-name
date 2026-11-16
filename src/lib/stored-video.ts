import 'server-only';
import { r2Delete, r2Download, r2DownloadUrl } from '@/lib/r2';
import { videoStorage } from '@/lib/supabase';
import type { Video } from '@/types/db';

// Video files live on Supabase (older, up to 50 MB) or R2 (newer, up to 2 GB).
// Thumbnails and speech audio always stay on Supabase.
// YouTube videos have no file of ours (`storagePath` is null): the page plays them by id.
type StoredVideo = Pick<Video, 'storageProvider' | 'storagePath'>;

function filePathOf(video: StoredVideo): string {
  if (video.storagePath === null) throw new Error('This video has no stored file.');
  return video.storagePath;
}

/** Signed playback link, valid for `seconds`. */
export async function videoPlaybackUrl(video: StoredVideo, seconds: number): Promise<string> {
  const path = filePathOf(video);
  if (video.storageProvider === 'r2') return r2DownloadUrl(path, seconds);
  const { data, error } = await videoStorage().createSignedUrl(path, seconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function downloadVideoFile(video: StoredVideo): Promise<Blob> {
  const path = filePathOf(video);
  if (video.storageProvider === 'r2') return r2Download(path);
  const { data, error } = await videoStorage().download(path);
  if (error) throw error;
  return data;
}

/** Removes our copy. A YouTube video stays on YouTube: the owner deletes it in YouTube Studio. */
export async function deleteVideoFile(video: StoredVideo): Promise<void> {
  if (video.storagePath === null) return;
  if (video.storageProvider === 'r2') return r2Delete(video.storagePath);
  const { error } = await videoStorage().remove([video.storagePath]);
  if (error) throw error;
}
