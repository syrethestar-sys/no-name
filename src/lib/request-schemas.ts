import { z } from 'zod';
import { COMMENT_MAX_LENGTH } from '@/lib/comments';
import { MEMBER_INTERESTS } from '@/lib/members';
import { AUDIO_PATH_PATTERN } from '@/lib/supabase';

// Request bodies the API routes check. Kept here (not in the route files) so tests can use them.

export const CommentBody = z.object({
  text: z.string().trim().min(1).max(COMMENT_MAX_LENGTH),
  parentId: z.uuid().optional(),
});

export const RatingBody = z.object({ stars: z.number().int().min(1).max(5) });

export const JoinRequestBody = z.object({
  intro: z.string().trim().min(20).max(1000),
  interests: z.array(z.enum(MEMBER_INTERESTS)).max(MEMBER_INTERESTS.length).default([]),
  link: z
    .string()
    .trim()
    .max(300)
    .url()
    .refine((value) => /^https?:\/\//i.test(value), 'http(s) only')
    .nullable()
    .default(null),
});

/** `audioPath`: the owner's browser just uploaded speech-only audio for this video. */
export const TranscribeBody = z.object({
  audioPath: z.string().regex(AUDIO_PATH_PATTERN).optional(),
});
