import 'server-only';
import { z } from 'zod';
import type { Video } from '@/types/db';

/** Groq's free plan rejects bigger files. */
export const MAX_TRANSCRIBE_BYTES = 25_000_000;

const TranscriptionResponse = z.object({
  text: z.string(),
  language: z.string().optional(),
});

// Whisper names the language ("Mongolian"); we only store the two the site supports.
const LANGUAGE_CODES: Record<string, NonNullable<Video['language']>> = {
  mongolian: 'mn',
  english: 'en',
};

export type Transcription = { text: string; language: Video['language'] };

/** Speech → text with whisper-large-v3. Throws on any failure; callers log and mark the job failed. */
export async function transcribeFile(file: Blob, fileName: string): Promise<Transcription> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set. See .env.example.');

  const form = new FormData();
  form.append('file', file, fileName);
  form.append('model', 'whisper-large-v3');
  form.append('response_format', 'verbose_json');

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!response.ok) {
    throw new Error(`Groq transcription failed: ${response.status} ${await response.text()}`);
  }

  const { text, language } = TranscriptionResponse.parse(await response.json());
  return {
    text: text.trim(),
    language: LANGUAGE_CODES[language?.toLowerCase() ?? ''] ?? null,
  };
}
