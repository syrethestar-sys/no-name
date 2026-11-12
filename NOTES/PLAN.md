# Plan — Experience Video Community

Status: **APPROVED** (2026-11-12). Owner answers: guests watch without sign-in · replies allowed · videos in Mongolian + English · Phase 8 wanted.

## Goal

The owner uploads videos of their experiences. Signed-in members watch, like, comment and rate (1–5 stars).
Anyone can search videos by meaning ("the trip where it snowed") using transcripts.

## Who can do what

| Action                                           | Guest | Member (Clerk) | Owner (admin) |
| ------------------------------------------------ | ----- | -------------- | ------------- |
| Watch / browse / search                          | yes   | yes            | yes           |
| Like, comment, rate                              | –     | yes            | yes           |
| Delete own comment                               | –     | yes            | yes           |
| Upload / edit / delete video, delete any comment | –     | –              | yes           |

The owner is marked by Clerk `publicMetadata.role = "admin"`. Checked on the server, never just hidden in the UI.

## Database (Drizzle, `src/db/schema.ts`)

| Table              | Columns                                                                                                                                                                                          | Rules                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `videos`           | id, title, description, storagePath, thumbnailPath, durationSeconds, language (`mn`/`en`), transcript, status (`processing`/`ready`/`failed`), priceMnt (null = free), facebookPostId, createdAt |                                                                                                 |
| `likes`            | videoId, userId, createdAt                                                                                                                                                                       | unique (videoId, userId) → a click toggles                                                      |
| `ratings`          | videoId, userId, stars (1–5), updatedAt                                                                                                                                                          | unique (videoId, userId) → re-rating updates                                                    |
| `comments`         | id, videoId, userId, parentId (null = top-level), text (1–2000), createdAt                                                                                                                       | replies are one level deep, YouTube-style: a reply to a reply attaches to the top-level comment |
| `orders` (Phase 8) | id, userId, videoId (null = tip), amountMnt, status (`pending`/`paid`/`failed`), wireInvoiceId, createdAt                                                                                        | mark `paid` **only** from the verified Wire.mn webhook                                          |

Counts and the star average are computed with SQL. They are not stored as extra columns, so they cannot drift.

## How upload works

1. The owner picks a file on `/upload`. `POST /api/videos/upload-url` checks admin, then returns a **signed Supabase upload URL**.
2. The browser uploads straight to Supabase Storage, which avoids Next.js body-size limits. ⚠️ The Supabase free plan has a 50 MB per-file limit, so keep videos short or upgrade.
3. `POST /api/videos` saves the row with `status=processing`.
4. n8n webhook (secret header) → Hugging Face whisper transcript → embedding → Pinecone upsert → `status=ready`.

## Pages

- `/` is the feed: a grid of video cards with filter chips (Newest / Most liked / Top rated).
- `/videos/[id]` has the player, like button, star rating, comments and related videos (Pinecone).
- `/search?q=` searches by meaning.
- `/upload` and `/admin` are for the owner only.

## Phases (each = 1 small PR)

| #   | Phase                                                                                                   | Done when                                                  |
| --- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 0   | Scaffold ✅: Next.js + TS + Tailwind + shadcn, ESLint/Prettier/Husky, CI, `.env.example`, design tokens | `npm run lint && typecheck && build` pass                  |
| 1   | Clerk sign-in + admin role check helper ✅ merged, owner badge verified                    | Owner and member see different nav                         |
| 2   | DB schema + Supabase connection + migrations ✅ migrated + verified on Supabase                      | Tables exist                                               |
| 3   | Owner upload (signed URL) + feed grid + video page player ✅ code done (PR #3 + #4), owner browser test pending                                               | Uploaded video plays on `/videos/[id]`                     |
| 4   | Likes (toggle)                                                                                          | Count updates, one like per user                           |
| 5   | Ratings (1–5 stars)                                                                                     | Average shown on card + page                               |
| 6   | Comments + replies (add / reply / delete)                                                               | zod-validated, friendly errors, replies shown under parent |
| 7   | n8n + HF transcript + Pinecone search + "related videos"                                                | `/search` finds a video by meaning in Mongolian or English |
| 8a  | Facebook Page auto-post: n8n posts title + link when a video becomes `ready`                            | Post appears on the owner's Page                           |
| 8b  | Wire.mn: supporter tips + optional paid videos (`priceMnt`)                                             | Paid video unlocks only after the verified webhook         |

## Language (Mongolian + English)

- Whisper auto-detects the language. The detected language is saved in `videos.language`.
- Embeddings use `paraphrase-multilingual-MiniLM-L12-v2`, which covers Mongolian and English. A search in English can find a Mongolian video and the other way round.
- UI text is English first. Mongolian UI translation is a possible later task.

## Open questions (not blocking until Phase 8)

1. What tip amounts, and what price range for paid videos?
2. Which Facebook Page, and does the owner have admin access for a Page token?

## Phase 2 decisions (2026-11-12)

- Driver: `postgres` (postgres-js v4) + `drizzle-orm/postgres-js`, `prepare: false` for the Supabase transaction pooler (port 6543).
- **RLS is on with no policies** for every table. The app only reaches the DB through Drizzle on the server, so Supabase's public REST/anon key can read nothing.
- The DB enforces the rules too: likes/ratings use a composite primary key (one per user per video), `stars` is CHECKed 1–5, comment `text` is CHECKed 1–2000 characters, and `parent_id` self-references with cascade delete.
- `priceMnt`, `facebookPostId` and `orders` are left out until Phase 8 (added by a later migration).
- Scripts: `npm run db:generate` (writes SQL to `drizzle/`), `npm run db:migrate` (applies it), `npm run db:studio`.

## Phase 3 plan (2026-11-12) — upload, feed, player

Split into two PRs so each stays reviewable (rule: under ~300 lines of hand-written code):

**3a — Storage + owner upload** (`feat/video-upload`)
- Supabase Storage bucket `videos`, **private**, 50 MB limit, allowed types: mp4 / webm / quicktime / jpeg. Created once by `npm run storage:setup`.
  Private, because Phase 8 has paid videos. Viewers get short-lived signed URLs.
- `src/lib/supabase.ts`: server-only storage client (service role key), created lazily.
- `src/db/index.ts`: `getDb()` creates the connection lazily, so `next build` in CI works without DATABASE_URL (no GitHub secret needed).
- `POST /api/videos/upload-url`: admin only + zod (type, size ≤ 50 MB) → signed upload URLs for `videos/<id>.<ext>` and `thumbnails/<id>.jpg`.
- The browser PUTs the file straight to Supabase (no Next.js body limit). It also grabs a thumbnail frame + duration from the video with `<canvas>`.
- `POST /api/videos`: admin only + zod → inserts the row with `status = 'ready'`.
  (Phase 7 adds transcripts separately: `transcript IS NULL` = not transcribed yet. `status` stays the upload state.)
- `/upload` page (owner only, otherwise 404) with `UploadForm`.
- shadcn/ui is installed here. Our dark palette is mapped onto shadcn's token names.

**3b — Feed + video page** (`feat/video-feed`, stacked on 3a)
- `/` grid of `VideoCard`s (thumbnail, title, duration, date), newest first, signed thumbnail URLs.
  Filter chips (Most liked / Top rated) arrive with Phases 4–5.
- `/videos/[id]`: `<video controls>` with a signed URL (1 h), title, description, date. 404 when missing.
- Owner-only delete button + `DELETE /api/videos/[id]` (removes the storage files + row; likes/ratings/comments cascade).
