// Browser-only helpers shared by the owner's upload forms. No secrets here.
import { uploadToSignedUrl } from '@/lib/video-file';

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? 'Something went wrong. Try again.');
  return data as T;
}

/** Uploads the speech-only audio if the browser made one. Any failure means "no audio". */
export async function uploadSpeechAudio(
  audio: Blob | null,
  audioUploadUrl: string,
  audioPath: string,
): Promise<string | null> {
  if (!audio) return null;
  try {
    await uploadToSignedUrl(audioUploadUrl, audio, 'audio/webm');
    return audioPath;
  } catch {
    return null;
  }
}
