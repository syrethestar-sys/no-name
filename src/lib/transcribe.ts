import 'server-only';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { videos } from '@/db/schema';
import { MAX_TRANSCRIBE_BYTES, transcribeFile } from '@/lib/groq';
import { deleteVideoDocuments, upsertDocuments, type VideoDocument } from '@/lib/pinecone';
import { videoStorage } from '@/lib/supabase';
import type { Video } from '@/types/db';

// multilingual-e5-large reads up to 512 tokens; ~200 words stays well inside that.
const WORDS_PER_CHUNK = 200;

/** `{id}#meta` = title + description; `{id}#0…` = transcript chunks. */
export function buildDocuments(
  video: Pick<Video, 'id' | 'title' | 'description' | 'transcript'>,
): VideoDocument[] {
  const documents: VideoDocument[] = [
    {
      id: `${video.id}#meta`,
      videoId: video.id,
      text: [video.title, video.description].filter(Boolean).join('\n\n'),
    },
  ];
  const words = (video.transcript ?? '').split(/\s+/).filter(Boolean);
  for (let start = 0; start < words.length; start += WORDS_PER_CHUNK) {
    documents.push({
      id: `${video.id}#${start / WORDS_PER_CHUNK}`,
      videoId: video.id,
      text: words.slice(start, start + WORDS_PER_CHUNK).join(' '),
    });
  }
  return documents;
}

export type TranscribeOutcome = 'done' | 'failed' | 'too-big' | 'missing';

/**
 * Download → Groq whisper → save transcript + language → index in Pinecone.
 * Never throws: it logs and marks the video `failed`, so callers can fire and forget.
 */
export async function transcribeVideo(videoId: string): Promise<TranscribeOutcome> {
  const db = getDb();
  const [video] = await db.select().from(videos).where(eq(videos.id, videoId)).limit(1);
  if (!video) return 'missing';

  const markFailed = () =>
    db.update(videos).set({ transcriptStatus: 'failed' }).where(eq(videos.id, videoId));

  try {
    const { data, error } = await videoStorage().download(video.storagePath);
    if (error) throw error;
    if (data.size > MAX_TRANSCRIBE_BYTES) {
      await markFailed();
      return 'too-big';
    }

    const fileName = video.storagePath.split('/').pop() ?? 'video.mp4';
    const { text, language } = await transcribeFile(data, fileName);
    await db
      .update(videos)
      .set({ transcript: text, language, transcriptStatus: 'done' })
      .where(eq(videos.id, videoId));

    // Replace, don't append: a shorter re-transcript must not leave old chunks behind.
    await deleteVideoDocuments(videoId);
    await upsertDocuments(buildDocuments({ ...video, transcript: text }));
    return 'done';
  } catch (error) {
    console.error('transcribe failed', videoId, error);
    await markFailed().catch(() => undefined);
    return 'failed';
  }
}
