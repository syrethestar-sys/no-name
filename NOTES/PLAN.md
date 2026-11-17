# Plan — Experience Video Community

Status: **APPROVED** (2026-11-12). Owner answers: guests watch without sign-in · replies allowed · videos in Mongolian + English · Phase 8 wanted.

## Goal

The owner uploads videos of their experiences. Signed-in members watch, like, comment and rate (1–5 stars).
Anyone can search videos by meaning ("the trip where it snowed") using transcripts.

## Who can do what

Selective community (owner decision 2026-11-12: option **A** = semi-open, joining by **request → owner approves**). See `VISION.md`.

| Action                                                                | Guest / signed-in non-member    | Pending request            | Member (approved) | Owner (admin) |
| --------------------------------------------------------------------- | ------------------------------- | -------------------------- | ----------------- | ------------- |
| Watch **public** videos                                               | yes                             | yes                        | yes               | yes           |
| See **members-only** videos                                           | locked card + "Request to join" | locked + "Request pending" | yes               | yes           |
| Send a join request (must sign in)                                    | yes                             | –                          | –                 | –             |
| Like, rate, comment, reply                                            | –                               | –                          | yes               | yes           |
| Delete own comment                                                    | –                               | –                          | yes               | yes           |
| Approve / reject requests, upload / delete videos, delete any comment | –                               | –                          | –                 | yes           |

The owner is marked by Clerk `publicMetadata.role = "admin"`. Checked on the server, never just hidden in the UI.

## Database (Drizzle, `src/db/schema.ts`)

| Table              | Columns                                                                                                                                                                                          | Rules                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `videos`           | id, title, description, storagePath, thumbnailPath, durationSeconds, language (`mn`/`en`), transcript, status (`processing`/`ready`/`failed`), priceMnt (null = free), facebookPostId, createdAt |                                                                                                 |
| `likes`            | videoId, userId, createdAt                                                                                                                                                                       | unique (videoId, userId) → a click toggles                                                      |
| `ratings`          | videoId, userId, stars (1–5), updatedAt                                                                                                                                                          | unique (videoId, userId) → re-rating updates                                                    |
| `comments`         | id, videoId, userId, parentId (null = top-level), text (1–2000), createdAt                                                                                                                       | replies are one level deep, YouTube-style: a reply to a reply attaches to the top-level comment |
| `orders` (Phase 9) | id, userId, videoId (null = tip), amountMnt, status (`pending`/`paid`/`failed`), wireInvoiceId, createdAt                                                                                        | mark `paid` **only** from the verified Wire.mn webhook                                          |

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

| #   | Phase                                                                                                                                                          | Done when                                                          |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 0   | Scaffold ✅: Next.js + TS + Tailwind + shadcn, ESLint/Prettier/Husky, CI, `.env.example`, design tokens                                                        | `npm run lint && typecheck && build` pass                          |
| 1   | Clerk sign-in + admin role check helper ✅ merged, owner badge verified                                                                                        | Owner and member see different nav                                 |
| 2   | DB schema + Supabase connection + migrations ✅ migrated + verified on Supabase                                                                                | Tables exist                                                       |
| 3   | Owner upload (signed URL) + feed grid + video page player ✅ code done (PR #3 + #4), owner browser test pending                                                | Uploaded video plays on `/videos/[id]`                             |
| 4   | **Membership** (new, see below): join request form, owner approval page, public/members video visibility ✅ code done (PR #5 + #6), owner browser test pending | Non-member can't get a members-only video URL; approved member can |
| 5   | Likes (toggle)                                                                                                                                                 | Count updates, one like per user                                   |
| 6   | Ratings (1–5 stars)                                                                                                                                            | Average shown on card + page                                       |
| 7   | Comments + replies (add / reply / delete)                                                                                                                      | zod-validated, friendly errors, replies shown under parent         |
| 8   | n8n + HF transcript + Pinecone search + "related videos"                                                                                                       | `/search` finds a video by meaning in Mongolian or English         |
| 9a  | Facebook Page auto-post: n8n posts title + link when a video becomes `ready`                                                                                   | Post appears on the owner's Page                                   |
| 9b  | Wire.mn: supporter tips + optional paid videos (`priceMnt`)                                                                                                    | Paid video unlocks only after the verified webhook                 |

## Language (Mongolian + English)

- Whisper auto-detects the language. The detected language is saved in `videos.language`.
- Embeddings use Pinecone's integrated `multilingual-e5-large` (see Phase 8 provider change), which covers Mongolian and English. A search in English can find a Mongolian video and the other way round.
- UI text is English first. Mongolian UI translation is a possible later task.

## Open questions (not blocking until Phase 9)

1. What tip amounts, and what price range for paid videos?
2. Which Facebook Page, and does the owner have admin access for a Page token?

## Phase 2 decisions (2026-11-12)

- Driver: `postgres` (postgres-js v4) + `drizzle-orm/postgres-js`, `prepare: false` for the Supabase transaction pooler (port 6543).
- **RLS is on with no policies** for every table. The app only reaches the DB through Drizzle on the server, so Supabase's public REST/anon key can read nothing.
- The DB enforces the rules too: likes/ratings use a composite primary key (one per user per video), `stars` is CHECKed 1–5, comment `text` is CHECKed 1–2000 characters, and `parent_id` self-references with cascade delete.
- `priceMnt`, `facebookPostId` and `orders` are left out until Phase 9 (added by a later migration).
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

## Phase 4 plan — Membership (2026-11-12, waiting for owner OK)

Audience: **viewers can be anyone** (public videos, no requirements). Members are whoever the owner approves; trading / coding / sharing are examples, not requirements.

**Data (one migration)**

- `members`: `user_id` (Clerk id, PK), `status` (`pending` / `approved` / `rejected`), `interests` (optional array: `trading` / `coding` / `sharing` / `other`, used only to help the owner decide), `intro` (short: who you are / why join, 20–1000 chars), `link` (optional: GitHub / portfolio / trading journal), `created_at`, `reviewed_at`.
  Our DB is the single source of truth. Owner (Clerk role admin) always counts as a member.
- `videos.visibility`: `public` / `members`, **default `members`**. The owner picks it on upload and can change it later.
- `videos.topic`: `trading` / `coding` / `life`. Feed filter chips use it.

**Access is enforced on the server**

- `isMember()` helper. A signed playback URL is created **only** for public videos or for members. Non-members get a locked card (blurred thumbnail + "Members only") and never the video URL.
- `/videos/[id]` for a locked video shows the poster, title and a Join CTA, without a `<video>` src.

**Pages / routes**

- `/join` (signed in): form with intro (required), optional interests checkboxes, optional link → `POST /api/members/request` (zod, one request per user, can't re-apply for 7 days after a rejection).
- `/admin/members` (owner): pending list with intro, interests, link → Approve / Reject (`PATCH /api/members/[userId]`).
- Header: "Join" for non-members, "Pending" badge, "Members" link with a pending count for the owner.

**Later (not in Phase 4):** email to the owner on a new request, and a welcome email on approval (n8n).

## Phase 5 plan — Likes (2026-11-12, approved)

Anyone signed in can like a video they can watch (owner decision 2026-11-12: no join needed to like; members-only videos still need membership). One like per user per video. The `likes` table already exists (composite PK `videoId + userId`), so **no migration**.

- `POST /api/videos/[id]/like` with body `{ liked: boolean }` (the state the viewer wants, so a double click or retry can't flip it twice): requires a signed-in user and a `ready` video; members-only videos also need `isMember` (403), then `INSERT ... ON CONFLICT DO NOTHING` or `DELETE`. Returns `{ liked, likeCount }`. zod-validated. Friendly errors ("Could not save. Try again.").
- Counts are computed with SQL, never stored: the feed uses `left join likes` + `group by videos.id`; the video page uses `getLikeState()` in `src/lib/likes.ts` (count + whether the viewer liked it).
- `src/components/like-button.tsx` (client): heart + count, optimistic update, rolls back on error. Guests see the count and a "Sign in to like" hint; on a locked video non-members see just the count (the page already shows the join prompt).
- Feed card shows the like count. The "Most liked" filter chip is added to the feed (ordered by like count, then newest).
- Done when: count updates, a second click un-likes, a second account adds a separate like, guests and non-members get 401/403 on the route.

## Phase 5b plan — Own sign-in UI (2026-11-12, approved)

Owner wants no Clerk-looking UI: no Clerk modal, no "Secured by Clerk", no "Development mode" badge. **Clerk stays underneath** (sessions, email codes, Google, bot protection, `auth()` on the server). Only the screens become ours, built with Clerk's hooks (`useSignIn`, `useSignUp`, `useClerk`, `useUser`), shadcn/ui and our tokens.

**Sign-in methods:** email code (6 digits, no password) and "Continue with Google". Phone (+976) waits until Mongolia is enabled in Clerk Dashboard → SMS → Settings.

**What gets built**

- `AuthForm` (one client component, used by both the popup and the pages): step 1 email (or Google), step 2 enter the code. It signs in an existing account or signs up a new one automatically, so there's no separate "Sign up" form for users to pick. Resend code, change email, friendly errors ("That code is wrong or expired. Try again.").
- `AuthDialog`: our own popup (shadcn Dialog, Base UI) wrapping `AuthForm`. Opened by the header "Sign in" button and by "Sign in to like" (and later rate/comment). After sign-in it closes and refreshes the page, so the like button works right away.
- `/sign-in` page: same form full-page (for links and when JS opens it directly). `/sign-up` redirects to `/sign-in`.
- `/sso-callback` page: finishes Google sign-in and returns the user to where they started.
- `AccountMenu` replaces Clerk's `UserButton`: avatar + name, links (Join / Members for owner), "Sign out". Profile editing (change email, delete account) is out of scope for now.
- Env: `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-in` so anything Clerk redirects to lands on our page.
- `<div id="clerk-captcha" />` inside the form: needed for Clerk's bot protection on sign-up.

**Notes / limits**

- "Development mode" only appears in Clerk's own widgets. With our UI it disappears from the site. Clerk's dev-instance emails may still say development until a production instance is set up (before launch).
- The browser console keeps one Clerk "development keys" warning in dev; it isn't visible to users.
- Size: about 4 components + 2 pages, ~350 lines. Will split into two PRs if it goes over: (1) form + popup + pages, (2) account menu.

**Done when:** sign in with email code and with Google from the popup and from `/sign-in`; a new email creates an account; sign out works; no Clerk-branded UI appears anywhere on the site; owner badge, Upload and Members links still work.

## Phase 6 plan — Ratings, 1–5 stars (2026-11-12, approved)

Same rules as likes: **anyone signed in** can rate a video they can watch (members-only videos need membership). The `ratings` table already exists (one row per user per video, stars CHECKed 1–5), so **no migration**.

- `PUT /api/videos/[id]/rating` body `{ stars: 1–5 }` (zod): insert, or update on conflict (re-rating changes your stars, `updated_at` = now). `DELETE` the same path removes your rating. Returns `{ myStars, average, count }`. 401 guest / 403 members-only for non-members / 404 missing.
- Average and count computed with SQL (`avg(stars)`, `count(*)`), never stored.
- `src/lib/ratings.ts`: `getRatingState(videoId, userId)` for the video page, `setRating()` / `clearRating()`.
- `StarRating` (client): 5 stars, hover preview, click to rate, click your current star again to remove it; keyboard (arrow keys) + screen-reader labels ("Rate 4 out of 5"). Optimistic update with rollback ("Could not save. Try again."). Guests: "Sign in to rate" opens our sign-in popup.
- Video page: stars under the title next to the like button, with "4.3 · 12 ratings" (or "No ratings yet").
- Feed card: "★ 4.3" next to the like count (hidden when no ratings).
- Feed: "Top rated" sort chip (`?sort=rated`): ordered by average, then rating count, then newest. Videos with no ratings go last.

**Done when:** rating, re-rating and removing all work and survive a reload; average and count are right with two accounts; card and "Top rated" reflect it; guests get the sign-in popup.

## Phase 7 plan — Comments + replies (2026-11-12, approved)

The `comments` table already exists (`parent_id` for replies, text CHECKed 1–2000 chars, cascade delete), so **no migration**.

**Who can do what** (same rule as likes/ratings)
- Read: anyone who can watch the video (guests on public videos too).
- Write and reply: anyone signed in, on a video they can watch (members-only videos need membership). Guests see "Sign in to comment", which opens our popup.
- Delete: your own comments; the owner can delete any comment.

**API** (zod on every body, friendly errors, access via the shared `checkCanReact()`)
- `POST /api/videos/[id]/comments` `{ text, parentId? }`: text is trimmed, 1–2000 characters. A reply to a reply attaches to its top-level comment (YouTube-style, one level deep), and `parentId` must belong to the same video.
- `DELETE /api/comments/[commentId]`: author or owner only (403 otherwise). Deleting a top-level comment also deletes its replies (DB cascade).
- Simple flood guard: at most 5 comments per user per minute (429 "Slow down a little.").

**Data shown**
- `src/lib/comments.ts`: `listComments(videoId)` returns top-level comments newest first (first 50, then "Show more") with their replies oldest first.
- Author name and avatar come from Clerk (`clerkClient().users.getUserList({ userId: [...] })`, one batch call per page). Names are never stored in our DB. If Clerk is unreachable, show "Member" with an initial instead of failing the page.
- A comment count shows next to the "Comments" heading.

**UI** (one component per file)
- `CommentsSection` (server) → `CommentForm` (client: textarea, live character count, Post), `CommentItem` (avatar, name, relative time like "3 h ago", text with line breaks, Reply / Delete), `ReplyList`.
- After posting or deleting it calls `router.refresh()`, so the server stays the single source of truth. The form clears and shows "Posting…" while busy.
- Plain text only (no links or markdown), so there's no HTML injection. React escapes the text.

**Not in this phase:** editing comments, likes on comments, notifications, and reporting or moderation tools beyond owner delete.

**Done when:** post / reply / delete work and survive a reload; a reply to a reply lands under the top-level comment; someone else's comment can't be deleted (403) except by the owner; guests get the sign-in popup; members-only rules hold.

**Owner answers (2026-11-12):** deleting a top-level comment removes its replies too; 5 comments per minute per person is OK.

**PRs:** (1) `feat/comments` — `src/lib/comments.ts` + the two API routes; (2) `feat/comments-ui` — the components and the video page.

## Phase 8 plan — Transcripts + search by meaning (2026-11-12, approved)

Goal: `/search?q=` finds a video by what is *said* in it, in Mongolian or English, and each video page shows "Related videos". Videos stay watchable right after upload; the transcript arrives later in the background.

**Data (one migration)**
- `videos.transcript_status`: `pending` / `done` / `failed` (default `pending`). `videos.language` and `videos.transcript` already exist and get filled in.
- Nothing else is stored in Postgres. Vectors live in Pinecone.

**Background job** (logic lives in our code; n8n only triggers and retries it)
1. After `POST /api/videos` saves a row, the server calls the n8n webhook with `{ videoId }` and the secret header. If n8n is down, the upload still succeeds and the video stays `pending`.
2. n8n calls our `POST /api/jobs/transcribe` with `x-webhook-secret` (checked with a constant-time compare, zod body). It retries 3 times with a delay. The workflow JSON is committed in `n8n/transcribe.json` so it can be imported.
3. The route:
   - downloads the file through a signed URL;
   - sends it to Hugging Face `openai/whisper-large-v3`, which returns text and the detected language;
   - saves `transcript`, `language` and `transcript_status = done`;
   - indexes the video in Pinecone.

   On error it saves `failed` with no raw error shown.
- Indexing: one vector for title + description (`{videoId}#meta`), plus one per ~100-word transcript chunk (`{videoId}#0`, `#1`, …), because MiniLM only reads ~128 tokens. Embeddings come from HF `paraphrase-multilingual-MiniLM-L12-v2`, 384 dims. Metadata holds `{ videoId, chunk text }`.
- Owner tools on the video page: the transcript status and a "Transcribe" / "Try again" button. It runs the same job directly, so it works for videos uploaded before Phase 8 and when n8n isn't set up.
- Deleting a video also deletes its vectors (by ID prefix). Editing a title re-indexes `#meta`.

**Search** (`/search?q=`, the header already links to it)
- Embed the query → Pinecone top 30 → keep the best score per video → load those videos from the DB (ready only). Results use the same card grid, and the same lock rules apply.
- A result shows the matching transcript snippet ("…we drove to Khövsgöl and it snowed…"). **Members-only videos never show a snippet to non-members**, only the locked card, so their transcripts don't leak.
- If Pinecone or HF is down, or keys are missing, it falls back to a simple title/description text match and says "Showing simple matches."
- Empty query → a short hint. No results → "Nothing found. Try other words."

**Related videos**
- Video page: query Pinecone with the video's `#meta` vector → 4 other videos as small cards, skipping itself. Hidden if Pinecone isn't reachable.

**Transcript on the page**
- A collapsed "Transcript" section under the description, for people who can watch the video.

**Files:** `src/lib/hf.ts` (whisper + embeddings), `src/lib/pinecone.ts` (upsert/query/delete), `src/lib/transcribe.ts` (the job), `src/app/api/jobs/transcribe/route.ts`, `src/app/search/page.tsx`, `RelatedVideos`, `TranscriptPanel`, `TranscribeButton`. New package: `@pinecone-database/pinecone` (official SDK). HF is called with plain `fetch`.

**PRs:** (1) migration + hf/pinecone/transcribe libs + job route + owner button + n8n workflow; (2) `/search`; (3) related videos + transcript panel. Each under 300 lines.

**Owner setup needed** (I'll give click-by-click steps; I never see the values):
1. Hugging Face: a token with "Inference Providers" permission → `HF_TOKEN`.
2. Pinecone (free tier): an index named `videos`, **384 dimensions, cosine**, serverless → `PINECONE_API_KEY`, `PINECONE_INDEX=videos`.
3. n8n: an instance (n8n Cloud or self-hosted), import `n8n/transcribe.json` → `N8N_WEBHOOK_URL`, `N8N_WEBHOOK_SECRET` (any long random string, the same in both places). A deployed site URL is needed for n8n to call back; locally the owner button covers it.

**Risks, checked first with the existing test video before building the rest**
- Hugging Face's hosted whisper may not accept `.mp4` directly, or may cut off long files. If it fails, plan B: the browser extracts the audio track at upload time (smaller file, no server ffmpeg). I'll report before switching.
- HF free credits are small. Whisper on a few short videos is fine; many long videos may need a paid HF plan.
- Vercel function time limit (300 s) caps a single job at roughly 20–30 min of video, depending on HF speed.

**Done when:** an uploaded video gets a transcript and language automatically (or via the owner button); `/search` finds it with words from the speech in English and in Mongolian; a members-only result shows no snippet to a non-member; related videos appear; deleting a video removes its vectors.

**Owner answers (2026-11-12):** no n8n yet, so the upload route starts the job directly (Next.js `after()`) and the owner button retries; n8n is added later as the retry layer (the job route and workflow file still get built). Show the transcript on the video page, collapsed.

**Provider change (2026-11-12, owner wants free only; the owner set up Groq + Pinecone).** This replaces the Hugging Face parts above:
- Speech → text: **Groq** `whisper-large-v3` (free plan: ~2 h of audio per hour, **25 MB per file**). Tested: it accepts `.mp4` directly and returns the detected language. Files over 25 MB are marked `failed` ("too big for free transcription") for now; extracting the audio in the browser (plan B) comes later if needed.
- Embeddings: **Pinecone integrated embedding** `multilingual-e5-large` (1024 dims, free on Starter). Pinecone embeds the text itself, so there's no embedding model in our code. Tested: Mongolian queries find English text and the other way round.
- The index has a document schema (one field, `chunk_text`), so it uses Pinecone's **documents API** (`/namespaces/{ns}/documents/upsert|search|fetch|list|delete`, header `X-Pinecone-API-Version: 2026-07`) through plain `fetch`. The SDK isn't needed.
- Chunks: ~200 words (e5 reads up to 512 tokens). Scores sit close together (0.70–0.88), so search drops matches well below the best one.
- Env: `GROQ_API_KEY`, `PINECONE_API_KEY`, `PINECONE_INDEX`. `HF_TOKEN` isn't used.

## Restyle plan — feed looks like getlayers.ai (2026-11-13, approved)

Measured on getlayers.ai/templates (computed styles): page `#060606`, text `#f5f5f5`, quiet text `#a6a6a6`. Cards have **no border**: a 12px-rounded glass card (`rgba(255,255,255,0.04)`, brighter on hover) with ~5px inset, the thumbnail rounded 9px inside it on `#141414`. Below the thumbnail: ↗ arrow + small title + a "Free" badge on one row, a quiet sub-line under it. Filter chips are small (12px), `rgba(255,255,255,0.05)`, 10px radius, with a faint top highlight. The tabs are plain text that brightens when active. The heading is large, light weight (300) with a gradient, and has an eyebrow line ("62 templates · new layers weekly"). The grid is dense: 5 columns, ~4px gaps.

What changes (looks only, no data or behavior changes):
1. **Tokens** (`globals.css`): darker background (`#08090b`), new `--glass` / `--glass-hover` card tints and `--thumb` color. Mint stays the one accent. Fonts stay Inter + mono (CLAUDE.md).
2. **Video card**: borderless glass card with an inset thumbnail; on hover the card brightens, lifts 2px and gets a thin mint glow edge (CSS only). Under the thumbnail: ↗ + title + a small badge (`Public` mint / `Members` grey), then a sub-line `Coding · Nov 12` with ★ 4.5 ♥ 3 in mono on the right. Duration stays on the thumbnail; the lock overlay stays.
3. **Feed heading**: an eyebrow line `3 videos · trading, coding, life`, then a big light-weight gradient "Experiences" (white → grey), then the subline.
4. **Filters**: topics become a tab row (All, Trading, Coding, Life, with counts like getlayers); sort becomes small glass chips. Counts come from one small grouped query.
5. **Grid**: 2 columns → 3 → 4 on wide screens, tighter gaps (12px).
6. **Header**: thinner and sticky, with a slightly see-through background.
7. Search results and related videos use the same card, so they pick it up automatically.

**PR:** one `refactor/getlayers-style` PR, under 300 lines. Before/after screenshots in the PR.

## Deploy plan — put the site online (2026-11-13, owner: not yet)

Why now: Phase 9a (Facebook post with a link) and n8n both need a public address. Today the site only runs on the owner's PC.

**Where:** Vercel, Hobby plan (free), connected to the GitHub repo. Every merge to `main` deploys by itself, and every PR gets its own preview link. Address: `<name>.vercel.app` now, with a custom domain possible later.

**What fits already, so no code changes:**
- Video files go from the browser straight to Supabase with a signed URL. Vercel's 4.5 MB request limit never sees them.
- Transcription runs in `after()` with `maxDuration = 300`. 300 s is allowed on the free plan.
- All secrets come from environment variables. The owner pastes them into Vercel's dashboard, and I never see them.

**Steps (owner clicks, I give exact instructions and check the result):**
1. vercel.com → sign in with GitHub → Import `syrethestar-sys/no-name`, framework Next.js, no other settings.
2. Settings → Environment Variables: copy every key from `.env.local` (Clerk, Supabase, Groq, Pinecone). Leave the n8n, Facebook and Wire keys empty for now.
3. Deploy, then send me the URL. I check: feed, sign-in (email code + Google), upload of a short video, auto transcript, `/search`, members-only lock, comments.
4. Clerk Dashboard → add the Vercel URL to allowed origins and redirect URLs (Google sign-in needs it).

**Limits to know:**
- **Clerk stays on its development instance.** It works on `vercel.app`, but shows a small "Development mode" badge. Its users are separate from a future production instance, so they would have to sign up again. A Clerk **production** instance needs a domain you own (~$10/year), plus your own Google sign-in keys. Recommended once the site goes public for real.
- **Vercel Hobby is for non-commercial use.** It's fine until Phase 9b (Wire.mn payments). Before taking money, move to Pro ($20/month) or another host.
- Nothing changes in Supabase, Groq or Pinecone. They're already cloud services.

**My part:** a small docs PR (this plan + a "Deploy" section in the handoff note). If something breaks online but works locally, I fix it with a normal plan → PR.

## Restyle plan, part 2 — the other pages (2026-11-13, approved)

Same look as the new feed. Looks only: no data, routes or behavior change.

**Shared pieces**
- `PageHeading` component: a mono eyebrow line, a large light-weight gradient title and a quiet subline, the same as the feed's "Experiences". The feed switches to it too.
- `glass-panel` utility in `globals.css`: rounded, `--glass` background, a faint top edge and no border. It replaces the bordered `bg-card` boxes (upload form, join, sign-in, member requests, transcript, owner tools).

**PR 1: search, upload, join, sign-in, members**
- Search: page width and grid match the feed (up to 4 columns). The search box becomes a large rounded glass field with a search icon and the button inside it. The matching sentence sits in a quiet quote under each card.
- Upload, join, sign-in, members: `PageHeading` plus glass panels. Member request rows become glass rows.

**PR 2: video page**
- Wider page with two columns on large screens. On the left: player, title, info and reactions, description, transcript, comments. On the right: "Related videos" as a column of cards. On phones the columns stack, the same as now.
- Player: rounded, no border, with a faint mint glow behind it.
- Title in the new light heading style. Topic, visibility, date and length become small mono chips.
- Owner tools (visibility, transcribe, delete) are grouped in one glass panel labelled "Owner".
- The locked-video teaser gets the same rounded, borderless look.

Each PR stays under 300 lines. Checked at desktop and phone width before merging.

## Big videos plan — transcripts for files over 25 MB (2026-11-13, approved)

**Problem:** Groq's free plan takes at most 25 MB per file. A 1-minute phone video is often 50–150 MB, so real videos would get no transcript and no search.

**Fix: send Groq only the sound.** At upload, the browser pulls the audio out of the video and re-encodes it as small speech-quality audio (Opus, mono, 24 kbps, about 11 MB per hour). The video itself is uploaded unchanged.
- Library: **Mediabunny** (MPL-2.0, no server, uses the browser's built-in WebCodecs). It reads mp4/mov/webm and writes a `.webm` audio file. Its only cost is page size on the upload page, which only the owner opens.
- The audio is stored next to the video in the private bucket as `audio/<id>.webm`. A new nullable column `videos.audio_path` (migration) records it.
- The transcribe job uses the audio file if there is one. Otherwise it uses the video if it's under 25 MB, and otherwise marks "too big" as now.
- If the browser can't extract the audio (old Safari or Firefox without WebCodecs), the upload still works. It just falls back to the old rule.
- **Old videos:** the owner's Transcribe/Redo button does the same thing in the owner's browser. It downloads the video, extracts the audio, uploads it, then transcribes.
- Deleting a video also deletes its audio file.
- About 2 hours of speech fits in 25 MB. Anything longer is still "too big".

**⚠ Separate limit found while planning:** uploads are capped at **50 MB** because that's the largest file Supabase's **free** plan allows. A typical 1080p phone video hits that after about 1–3 minutes. Options (owner decides, not part of this PR):
1. **Shrink the video in the browser before upload** (same library, re-encode to 720p). Free, but slow for long videos, and 50 MB is still only ~5–8 minutes at 720p.
2. **Cloudflare R2 for video files** (free: 10 GB storage, no download fees, files up to 5 GB). Videos move there, everything else stays on Supabase. A bigger change, done as its own plan.
3. Supabase Pro ($25/month): 100 GB storage, large files.

**PRs:** (1) migration, `audio_path`, server job prefers audio, delete cleans up; (2) browser audio extraction in the upload form and the owner button. Each under 300 lines.

**Owner answer (2026-11-13):** build the audio plan; for the 50 MB limit, move video files to **Cloudflare R2** (its own plan next).

**Done when:** a video over 25 MB uploads, gets a transcript automatically and is found by `/search`; an old video gets one through the owner button; a browser without WebCodecs still uploads fine.

## R2 plan — video files on Cloudflare R2, up to 2 GB each (2026-11-13, approved)

**Why:** Supabase's free plan stops files at 50 MB. Cloudflare R2's free tier gives 10 GB of storage, no download (egress) fees, and single uploads up to 5 GB.

**What moves:** only new **video files**. Thumbnails and speech audio are small, so they stay in Supabase. The existing test video stays where it is.
- New column `videos.storage_provider` (`supabase` | `r2`, default `supabase`, migration). Playback links, transcript download and delete each pick the right place by this column. Old rows keep working.
- `src/lib/r2.ts` (server-only) makes signed R2 links with the tiny `aws4fetch` library (Cloudflare's recommended S3 signer, no AWS SDK). Signed **PUT** links for the owner's browser upload, and signed **GET** links (1 hour) for playback. The bucket stays private, so members-only videos stay protected the same way as now.
- Upload: `upload-url` returns an R2 link for the video. The limit goes from 50 MB to **2 GB** per file (my choice, so 10 GB holds at least 5 videos). The thumbnail and audio flow is unchanged.
- Delete removes the R2 object.

**Owner setup (I'll give click-by-click steps; I never see the values):**
1. Free Cloudflare account → R2 → enable it. Cloudflare asks for a card even on the free tier, but nothing is charged under 10 GB.
2. Create a bucket `no-name-videos` (private) and paste a CORS rule I provide (allows PUT/GET from `http://localhost:3005`, plus the real site address later).
3. Create an R2 API token (Object Read & Write, this bucket only) → `.env.local`: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=no-name-videos`.

**Limits:** 10 GB in total for free (about 1–2 hours of 1080p phone video). After that, $0.015 per GB per month. Browser uploads of very big files need a steady connection, and a failed upload starts over (no resume in this version).

**PRs:** (1) migration, `r2.ts`, playback/download/delete by provider; (2) upload goes to R2, and the 2 GB limit plus UI text. Each under 300 lines.

**Done when:** a video over 50 MB uploads, plays for members only (a guest gets no link), gets a transcript, and deleting it removes it from R2.

## Tests plan (2026-11-13, approved)

**Goal:** the important rules get checked automatically on every PR, so a later change can't quietly break them.

**Tool:** Vitest 4.1.12, fast and TypeScript-native. A new script `npm test`, and CI runs it after lint and typecheck.

**What gets tested** (pure logic, no real database or keys, so it's fast and free):
- **Members-only lock:** who gets a playback link (public, members, owner, guest).
- **Search filter:** keep matches near the best score, one result per video, no snippet for locked videos or `#meta` matches. To test this, the filtering moves out of `searchVideos` into a small pure function (no behavior change).
- **Transcript chunks:** ~200-word chunks, tiny chunks dropped, a `#meta` document always present.
- **Request checks** (the zod schemas): comment text 1–2000 characters, valid ids only, upload paths must match our folders, audio path pattern, video size limits.
- **Safety helpers:** sign-in `redirect_url` can't send people to another site, and search text with `%` and `_` is escaped.
- **Formatting:** "5 minutes ago", "2 GB", ratings, durations, and feed links keeping both filters.

Some helpers move from page files into `lib/` so tests can import them. Nothing behaves differently.

**Not in this round:** full browser tests (Playwright) that sign in and upload. They need test accounts and keys in CI, which is a later step.

**PRs:** (1) Vitest setup, CI step, formatting/helper tests; (2) lock, search, chunk and schema tests. Each under 300 lines.

## Design plan, part 3 (2026-11-13, owner picked all four)

1. **Mouse-follow glow:** a soft mint light on a card's edge follows the mouse (getlayers' "border glow"). One small client component sets `--glow-x/--glow-y` on hover, and the CSS draws a radial gradient on a 1px masked border. Mouse-only, and turned off for `prefers-reduced-motion`.
2. **Phone menu:** below `sm`, the header links (Search, Upload, Members, Join) move into a menu button (shadcn dropdown already in the project). The logo and the account button stay visible.
3. **Loading skeletons:** `loading.tsx` for the feed, search and video page. Grey glass placeholders with the same shapes (heading, chips, cards, player) and a gentle pulse.
4. **Featured video:** the feed's newest video (in the current topic/sort, on the first view) is shown big at the top: a wide thumbnail on the left; title, topic, date, likes, stars and a "Watch" button on the right. The rest go in the grid below. On phones it stacks.

**PRs:** (1) glow + phone menu; (2) skeletons + featured video. Each under 300 lines, checked at desktop and phone width.

## Viewfinder redesign — the Codescan look (2026-11-13 night, owner: "make design like getlayers codescan, pixel perfect… get done by morning")

Reference: getlayers.ai/layer/codescan, a paid template (3D WebGL room of CRT TVs inside a camcorder viewfinder). **Not cloned pixel for pixel:** the scene, code and copy are getlayers' paid product. This is an original build of the same *style* with our own content: CSS only, no WebGL, using our own video thumbnails.

What the style is made of, and how we do it:
1. **Viewfinder frame** around the whole screen: a thin rounded white line inset ~14px, with HUD text in the corners. Top-left: live fps. Top-right: `● REC` (blinking red dot). Bottom-left: today's date `[ 13 / 11 / 26 ]`. Bottom-right: a running timecode `[ 00:04:39 ]` (time on the page). It's a fixed overlay with `pointer-events: none`, stays static for reduced motion, and gets a smaller inset on phones.
2. **Colors:** the background goes darker and slightly blue (`#07090a`). The accent becomes a **pale mint** (`#c4f5e6`), close to Codescan's pale cyan and still the "one mint accent" of CLAUDE.md. Primary buttons are solid pale mint with dark text. Secondary buttons have a thin white outline. The radius is 6px, not pills.
3. **Type:** headings use a tall condensed display font, **Oswald** (free Google font, has Cyrillic for Mongolian), in uppercase, light weight, with a pale mint→white gradient. The body stays Inter and the HUD uses JetBrains Mono. CLAUDE.md's design section is updated to match.
4. **Header:** a centered segmented control (Videos | Search | Join or Upload/Members) with the active part filled pale mint, like Codescan's `<> | Menu | Contact`. The logo sits left and sign-in/account right, inside the frame. The phone menu stays.
5. **Feed hero, "the wall":** a full-height dark room of CRT TV screens in CSS 3D perspective on both sides. The screens show the newest video thumbnails, and empty screens show animated static, colour bars or a soft glow. Scanlines, vignette, film grain and screen glow on top. The whole wall drifts a little after the cursor, and the screen under the mouse comes into focus while the others blur (rack focus). In the middle: the big condensed title, a crosshair `+`, one subline, and two buttons ("Watch the latest", "Join"). Below it come the tabs, the featured video and the grid, unchanged.
6. **Cards and player:** cards get faint scanlines and the mono meta line. The video player gets viewfinder corner brackets and a `● REC`-style label (`● PLAY`).

**PRs** (each under 300 lines, screenshots checked at desktop and phone width):
(A) tokens + Oswald + buttons + viewfinder frame;
(B) segmented header;
(C) TV-wall hero;
(D) headings, cards, player and other pages.

Owner reviews in the morning and anything can be reverted per PR.

## One filter button (2026-11-13, approved: "ok build it")

Owner: "change newest, most liked, trading, coding all that into one filter button with icon from lucide".

- (Owner changed it: **two buttons**, Topic left + Sort right, same menus, no Reset.) Replace the topic tabs + sort tabs above the grid with **one button**: lucide `SlidersHorizontal` icon + "Filter".
  When something other than the default is picked, the button shows it (e.g. `Filter · Coding · Most liked`) and a small mint dot.
- Click → dropdown (the existing shadcn/Base UI `dropdown-menu`), two groups:
  - **Topic**: All `LayoutGrid`, Trading `TrendingUp`, Coding `Code`, Work & life `Coffee` — each with its video count.
  - **Sort**: Newest `Clock`, Most liked `Heart`, Top rated `Star`.
  - The picked item has a `Check`. Each item is a link (same `?topic=&sort=` URLs as now), so back/forward and shared links keep working.
- A "Reset" item at the bottom when a filter is on.
- Files: new `src/components/feed-filter.tsx`; remove `topic-chips.tsx` + `sort-chips.tsx`; update `(feed)/page.tsx`. No server or DB change.
- Check: lint, typecheck, tests; screenshots wide + phone; keyboard (Tab, Enter, Esc) works.

## YouTube plan — link-only (Unlisted) videos streamed from YouTube (2026-11-16, approved)

**Why:** the owner wants to save storage by hosting video on YouTube instead of paying for our own. Visibility is **Unlisted** (link only), not Public and not Private.

**Honest limit:** Unlisted is not private. Anyone who has the video ID can watch it, and a signed-in member can copy the ID from the player. So YouTube videos are protected only by "we don't show the ID to people who may not see it". A leaked ID means a leaked video. This is fine for public videos. For members-only videos it is a risk the owner accepts. Paid videos (Phase 9b) should stay on R2.

**What changes:**
- `videos.storage_provider` gets a third value, `youtube`. New nullable column `videos.youtube_id` (migration). R2 and Supabase rows keep working, so a video picks its own home.
- The video page shows a YouTube player (`youtube-nocookie.com` embed) instead of a signed file link. The server puts `youtube_id` in the page **only** for viewers who may watch, exactly where a signed link is made today. A guest on a members-only video gets the locked card with no ID.
- Thumbnails stay in our Supabase bucket (not YouTube's public thumbnail address), so a locked card never carries the ID.
- Transcripts, search and "related videos" are unchanged. The browser still pulls the speech audio out of the local file (Mediabunny), so Groq gets `audio/<id>.webm`. The video file itself is not uploaded to us.
- A small `src/lib/youtube.ts` turns any pasted YouTube link (watch, youtu.be, shorts) into the 11-character ID, checked with zod. Unit-tested.
- Delete removes our row, audio and thumbnail. It **cannot** delete the YouTube video: the owner does that in YouTube Studio. The delete dialog says so.

**Upload (my recommendation: paste a link, no YouTube API):**
1. The owner uploads the video in YouTube Studio, sets visibility to **Unlisted**, and leaves "Allow embedding" on.
2. On `/upload` the owner picks the same file (for audio, length and thumbnail in the browser) and pastes the YouTube link.
3. We save the row. n8n transcribes from the audio as now.
- Why not upload through the YouTube API: it needs a Google OAuth flow, and, as I understand it, a low daily quota and a Google review before uploads can be anything but Private. I'd check this before choosing it. It can come later as its own plan.

**Limits and costs:**
- Storage and bandwidth cost nothing. YouTube may show ads, end-screen suggestions (`rel=0` keeps them to our channel) and its own controls. The camcorder look stays around the player, not on its buttons.
- If YouTube removes or blocks a video, the page shows a friendly "unavailable" message.
- Extra Google/YouTube rules apply to our content (copyright claims, takedowns).

**Open questions (owner decides):**
1. **Which videos use YouTube?** The owner picks per upload, with R2 kept for paid and sensitive ones. **Owner answer (2026-11-16): per upload.**
2. **Members-only on YouTube:** OK with the leak risk above? **Owner answer (2026-11-16): yes, the leak risk is OK.**
3. **Paste a link** or build API upload? **Owner answer (2026-11-16): paste a link.**

**PRs:** (1) migration, `youtube.ts` + tests, server-gated YouTube player on the video page; (2) `/upload` paste-link mode and delete wording. Each under 300 lines.

**Done when:** the owner pastes an Unlisted link, the video plays on `/videos/[id]` for allowed viewers only, a guest on a members-only video gets no ID in the page source, a transcript appears, and `/search` finds it.

## Visual assets plan — Higgsfield trial (2026-11-16, approved)

**Why:** the owner started a Higgsfield trial (ends **2026-11-19 06:09 UTC**, auto-renewal cancelled, so nothing is charged). The site needs images and a short clip for the front page, topic covers, empty states and the TV wall before there are many real videos.

**Budget (the real limit):** the account shows **10 credits** and no unlimited models. Rough cost from the plan text: about 0.25 credit per image and about 6 per short video (an estimate, not confirmed). So: **about 12–15 stills and 1 test clip, not a full set of clips.** Rules for spending:
- Every generation call sets `max_credits`. I check the balance before and after each one and stop at 1 credit left.
- Stills first, at the cheapest quality that looks right (1k, then 2k only for keepers). One clip only after a still is approved.
- The owner sees each result before the next batch.

**Look (from `globals.css` tokens, not new colors):** near-black blue `#07090a`, one pale mint accent `#c4f5e6`, red REC dot `#ff4d4d` used sparingly, soft film grain, CRT scanlines, camcorder viewfinder framing. No people's faces and no text in the images (generated text is unreliable and would not match Oswald / Inter).

**What gets made:**
1. **Front page backdrop** (1 still, 21:9 or 16:9): dark room, glow of old TVs.
2. **Topic covers** (3 stills, 16:9): trading, coding, life. Used as filter-chip or card art if the owner likes them.
3. **Empty states** (2–3 stills): "no videos yet", "no results", "video unavailable".
4. **TV-wall filler** (up to 6 stills, 4:3): what the TVs without a video show instead of plain static or bars.
5. **One test clip** (about 5 s, 720p, 16:9, silent): made from the best TV-wall still. If it is good, the wall reuses it on several screens with different start times.
6. **Thumbnails for real videos:** not generated. A real frame from the video is more honest (see `VISION.md`: real, unfiltered experience). Generated covers are for site chrome only, never for the owner's experience videos.

**How they get on the site (a later PR, own plan check before code):**
- Files go in a new `public/art/`: stills as `.webp` under about 200 KB each, the clip as `.mp4` under about 2 MB (`muted loop playsInline`, `prefers-reduced-motion` shows the still instead).
- `CrtScreen` in `src/components/crt-tv.tsx` gets two filler kinds, `still` and `clip`. Static, bars and glow stay as the fallback.
- No secret keys involved. Nothing from Higgsfield is called at runtime: the files are generated once, then committed.
- Whole PR under 300 lines of code; binary assets listed in the PR description.

**Open points (owner):**
1. **Rights:** I have not read Higgsfield's terms for commercial use of trial-generated media. **Owner answer (2026-11-16): does not mind.** The assets stay easy to replace.
2. **Label:** **Owner answer (2026-11-16): no label.**
3. If the stills don't look right after the first batch, stop and re-plan instead of spending the rest of the credits.

**Done when:** the owner has approved a set of stills and a clip (or decided to stop), the balance is logged in the handoff note, and a follow-up PR wires approved files into the front page and the empty states.

## Real 3D TVs on the wall (2026-11-16, built while the owner slept)

**Owner (2026-11-16, going to sleep, "continue without asking me … i need the tv's look like real 3d old tv"):** this was taken as the OK to build. Rule 1 still holds in spirit: the work stays in an **open PR that is not merged**, so the owner reviews it first. Nothing else on `main` changes.

**Problem:** today each TV is a flat rounded rectangle with a glow. It has no depth, so it does not read as an old television.

**Fix, CSS only (no WebGL, same decision as the Codescan plan):** every TV becomes a small 3D object built from CSS-3D boxes (`transform-style: preserve-3d`), so its sides, top and rear are really there and change with the viewing angle and with the wall's mouse drift.
- **Cabinet:** a box (front, top, two sides) with a lit front bezel, a recessed glass screen, and a control column (two ridged knobs, a speaker grille, a small power light).
- **Tube housing:** two smaller boxes stepped behind the cabinet, so the back tapers like a CRT.
- **Antenna** (rabbit ears) on some TVs; **plastic or woodgrain** cabinet per TV.
- **Light:** face shading (top lightest, sides darker, back darkest) and a specular streak on the glass. The screen sits slightly proud of the bezel, so it shifts against it as the TV turns (parallax).
- Each TV has its own yaw/pitch, turned toward the room's middle. On hover it turns to face you (the existing hover zoom and "rack focus" blur stay).
- Own `perspective` per TV, sized in `cqw` so a big front TV and a small far one have the same shape.
- Colors are tokens in `globals.css` (`--crt-plastic*`, `--crt-wood*`, `--crt-metal`), none in components.
- Files: `src/components/crt-tv.tsx` (rewritten), new `src/app/crt-tv.css` (imported by `globals.css`), slot data in `tv-wall-hero.tsx`. Old `crt-case`, `crt-screen` utilities removed. No data, route or behavior change.
- Reduced motion: the static animation is already off; the hover turn is a short transition only.

**Check:** lint, typecheck, tests, build; screenshots at desktop and phone width; look at the hover state; confirm the wall still reads well under the title (the middle stays dark).

**Not in this PR:** Higgsfield stills or clips on the screens (their own plan above).

## TV-wall clip (2026-11-16, step from the Visual assets plan; owner: "do next")

**What:** three of the wall's filler TVs play the short Higgsfield clip `clip-trading.mp4` (864x496, about 0.76 MB, silent) instead of static, bars or a glow. The other fillers stay as they are.
- `CrtScreen` gets a `clip` kind (`src`, `start` as a 0–1 fraction of the clip). A small client component `ClipScreen` renders a `muted loop playsInline autoPlay` video and jumps to its `start` once the length is known, so the three screens are not in step.
- `prefers-reduced-motion`: no video is mounted; the screen shows the old glow instead. The clip loops with a visible jump (it does not loop seamlessly); accepted.
- Only three clips at once, and the same file, so the browser downloads it once.
- The file goes in `public/art/` (copied from `E:\Work\no-name-art\`). Nothing from Higgsfield is called at runtime.
- Not in this PR: the `clip-static-tv` animated empty state, topic covers, sign-in backdrop.

**Check:** lint, typecheck, tests, build (with a separate `distDir`, see the handoff), a look at the wall, and the network tab: one request for the clip.

## Topic covers and sign-in backdrop (2026-11-16, step from the Visual assets plan; owner: "yes do that")

Owner left the placement to me. Chosen, all site chrome (generated art never stands in for a video's own thumbnail):
- **Topic cover banner:** on the feed, when a topic is picked (`/?topic=trading|coding|life`), the plain heading becomes a wide cover banner (`topic-trading|coding|life` stills, `webp`) with the same `PageHeading` over a dark gradient, plus one short line per topic. The front page (TV wall) and sort-only views are unchanged. New `TopicBanner` component; the cover files live in `public/art/`.
- **Sign-in backdrop:** `backdrop-02` (the room of glowing TVs, no brackets) fills the sign-in page behind the glass card, dimmed with a gradient so the form stays readable. `/join` is not changed: it has a long left-aligned text block that would fight the picture.
- Files: `src/components/topic-banner.tsx`, `src/components/page-backdrop.tsx`, `src/app/sign-in/page.tsx`, `src/app/(feed)/page.tsx`, `public/art/*.webp` (quality 90, under ~150 KB each).
- No data, route or behavior change.

**Check:** lint, typecheck, tests, build (separate `distDir`), a look at `/?topic=...` for all three and at `/sign-in` (desktop; phone if the window can be resized).

## Profile menu + /settings page (2026-11-16, APPROVED; owner chose A: delete a deleted person's comments)

Owner: "we need more settings on profile button". Chosen in a question round: **all four** — edit profile, my membership, my activity, account safety — on **a `/settings` page**, with the avatar menu linking to it.

**Menu (`AccountMenu`):** Profile · Membership · Activity · (owner only: Upload, Members) · Sign out. Each link opens `/settings/<tab>`.

**`/settings` page:** signed-in only (guests are sent to `/sign-in?redirect_url=/settings`). Left tab list, content on the right; on a phone the tabs sit on top. Same `PageHeading` + glass panels. Tabs are real routes (`/settings/profile`, `/membership`, `/activity`, `/safety`) so links and back button work.

1. **Profile** — change first/last name and photo. Built with Clerk's `useUser()` (`user.update`, `user.setProfileImage`), our own form (no Clerk widget). Photo: jpg/png/webp up to 5 MB, previewed before saving. Friendly errors ("Could not save. Try again.").
2. **Membership** — read-only status from our DB: member / request pending / not a member (with the "Join" link) / rejected with the date you can apply again. Owner sees "You are the owner" with shortcuts to Upload and Members.
3. **Activity** — three lists (first 30 each, newest first): videos you liked, your ratings (stars), your comments (text + the video it is on). Each links to the video. Videos you can no longer watch (members-only, you are not a member) show as a locked row without a title link. Server component, plain SQL joins, no new tables.
4. **Account safety** (Clerk):
   - **Email:** add a new email with a 6-digit code, make it primary, remove an old one.
   - **Devices:** list of signed-in sessions (browser, last active) with "Sign out" on each, plus "Sign out everywhere else".
   - **Delete account:** a confirm dialog where you type `DELETE`. `DELETE /api/me` (signed-in only, zod): **first** removes your rows in our database (`likes`, `ratings`, `comments`, `members`), **then** deletes the Clerk user on the server, then the browser signs out. DB first, so a failed Clerk call can simply be retried and nothing half-deleted is left behind. **The owner account cannot delete itself** (the button explains why), so the site can never lose its admin by a mis-click.

**Needs from the owner (Clerk dashboard):** User & Authentication → turn on **email** as an allowed identifier for adding addresses (it already is, sign-in uses email codes), and check the **delete account** and **multi-session / device** features are allowed. I will verify with a test account first and report if any is off.

**Decision for the owner — what happens to a deleted person's comments?**
- **A (recommended): delete them all.** Cleanest for privacy. A top-level comment takes its replies with it (the DB already works that way), so other people's replies under it disappear too.
- **B: keep the text, show "Deleted member".** Nobody's replies vanish, but the person's words stay on the site.

**PRs (each under 300 lines):** (1) `/settings` shell + menu links + Profile; (2) Membership + Activity; (3) Safety: email, devices; (4) Delete account (`/api/me`, with tests for the DB cleanup order and the owner block).

**Done when:** the menu opens every tab; a name/photo change shows in the menu and on comments after a refresh; membership and activity match the database; a second email can be added and made primary; another device can be signed out; deleting a test account removes its likes, ratings, comments and member row and the Clerk user, and the owner's delete button is disabled.

**Not in this plan:** notification settings (no emails are sent yet), theme (the site is dark-only), username, two-step login.

**As built (2026-11-16):** five stacked PRs instead of four: #47 shell + Profile, #48 Membership + Activity, #49 Account safety with Email, #50 Devices + our own "Confirm it's you" dialog, #51 Delete account. Changes from the plan above: (1) Clerk demands a fresh check (`session_reverification_required`) before signing another device out, so there is a re-verification dialog of our own (emailed code; `useConfirmedAction` hook) used by Devices and Delete account; (2) `DELETE /api/me` also demands `has({ reverification: 'strict' })` on the server; (3) the owner-only menu links (Upload, Members) were not repeated in the avatar menu because the header already has them; (4) the plan's "check delete / multi-session in the Clerk dashboard" turned out unnecessary: everything worked on the dev instance as it is. The re-verification dialog only handles the email-code factor; a Google-only account sees "sign out, sign in again, retry". Not built: phone layout checks, MFA.

## Animated empty state — `clip-static-tv` (2026-11-16, APPROVED)

**What:** the "no videos yet" banner on the feed plays the Higgsfield clip `clip-static-tv.mp4` (a whole old TV in a room, 864x496, about 0.76 MB, silent) instead of the still `empty-no-videos.webp`. It is the banner the clip was made for: the picture already shows one TV in a room.
- `EmptyState` gets an optional `clip` (a path in `public/art/`). With a clip, a small client component `EmptyClip` renders a `muted playsInline autoPlay` video over the still. The still is the `poster` and the first thing painted, so there is no empty flash while the file loads and nothing changes if the video fails.
- `prefers-reduced-motion`: no video is mounted; the still stays (same pattern as `ClipScreen`).
- Same crop as now (`object-cover`, same `objectPosition`), so the banner height and the text under it do not move.
- The clip does not loop seamlessly. **Default: play once and hold the last frame** (no visible jump). If the last frame looks wrong next to the still, fall back to `loop` and accept the jump, as on the wall.
- The file is copied from `E:\Work\no-name-art\` into `public/art/`. Nothing from Higgsfield is called at runtime.
- Search "Nothing found" keeps its still (the clip does not fit that message).
- About 40 lines of code (`empty-state.tsx` edit + `empty-clip.tsx`); the mp4 is listed in the PR description.

**Check:** lint, typecheck, tests, build (separate `distDir`, see the handoff), a look at the empty feed at desktop and phone width, reduced motion shows the still, and one request for the clip in the network tab. The feed only shows this banner when there are no videos, so I need the empty state to appear (a temporary filter that matches nothing, nothing committed).

**Owner (2026-11-16): OK.** Play once and hold the last frame (the default above).

## Database client recovers from dropped connections (2026-11-16, APPROVED: owner "ok")

**Problem:** at about 20:20 the dev server (up since 19:34) stopped finishing every page that reads the database: the page shell arrived in 0.1 s, then nothing, for 60 s. The Supabase project was healthy (no locks, all sessions idle, a direct query and a fresh pooler connection answered in about 1 s), the process was idle, and a restart fixed it. Most likely cause (**not proven**, the old server's log is gone): `src/db/index.ts` keeps one `postgres` client for the life of the process, and the pooler dropped connections that the client still thought were open. The library defaults make that easy: `idle_timeout` is off (idle connections are never closed), `connect_timeout` is 30 s, and a query has no time limit. Production would have the same weakness (one long-lived client per server instance).

**Fix (3 options, one file):** in `getDb()` pass `postgres(databaseUrl, { prepare: false, idle_timeout: 20, connect_timeout: 10, max_lifetime: 1800 })`.
- `idle_timeout: 20`: a connection idle for 20 s is closed, so a connection the pooler dropped in a quiet period is never reused; the next query opens a fresh one (about 1 s, as measured).
- `connect_timeout: 10`: a stuck connect fails after 10 s (the page's existing try/catch then shows "Could not load videos. Refresh to try again.") instead of waiting 30 s.
- `max_lifetime: 1800`: the library's own default is 30 to 60 minutes; made explicit so it is visible.
- A short comment says why. No other file changes.

**Not in this fix:** a per-query time limit. `postgres` has none of its own, and sending `statement_timeout` as a startup option may be refused by the Supabase transaction pooler (port 6543), so I would not guess; if the hang comes back with these options, that is the next step (test it against the pooler first).

**Check:** lint, typecheck, tests, build; open the home page twice 30 s apart (the second call must reconnect and answer, not hang). I cannot reproduce the original dropped-connection state on demand, so this PR **reduces the chance of the hang but is not proven to fix it**; the PR body will say so.

## Settings phone fixes (2026-11-16, APPROVED: owner "fix")

Found by a phone-width (390 px) check of the settings stack tip with a signed-in test user. No page scrolled sideways; two small problems:
- **The active "Account safety" tab was cut off** ("Account sa…"): the tab row scrolls but does not bring the active tab into view. Fix: the tab is labelled **"Safety"** (the page title and the avatar menu keep "Account safety"; the route is already `/settings/safety`).
- **Long text was cut with "…"** on the email row and the device row, so a full address could not be read on a phone. Fix: both wrap (`break-all` for the email, `break-words` for the device) instead of `truncate`.

Text and class changes only, in `settings-tabs.tsx`, `email-settings.tsx`, `device-settings.tsx`. One small PR on top of #51 (its base moves to `main` as the stack merges).

**Check:** lint, typecheck, tests, build, then the same phone-width look with a long test email address on the Safety tab.

## Phase 9a plan — Facebook Page auto-post (2026-11-18, WAITING FOR OWNER OK)

Owner picked this as the next job (2026-11-18). Goal: when the owner saves a video, the owner's Facebook Page gets a post with the title and a link to the video page.

**Needs a public address.** Facebook cannot show a preview of `localhost`. The code is built and unit-tested now, but a real post needs the site online (see the Deploy plan). Until `SITE_URL` is set the feature stays off and the owner button says so.

**Data (one migration):** `videos.facebook_post_id` text, nullable. Set only after Facebook accepts the post, so "posted" can never be claimed by mistake and a video is never posted twice.

**How it works** (logic in our code, like the transcript job; n8n is not set up, so no n8n route in this phase)
1. `src/lib/facebook.ts` (server-only): `postVideoToFacebook(videoId)` loads the video, builds the message, and calls the Graph API `POST /{FB_PAGE_ID}/feed` with `message`, `link` and the Page token (`FB_PAGE_TOKEN`) through plain `fetch`. Stores the returned post id. Never throws: it returns `'posted' | 'already' | 'off' | 'failed' | 'missing'`.
2. Message = title, a blank line, the first ~200 characters of the description (if any). The link is `SITE_URL/videos/<id>`. Facebook builds the preview card from the page's own tags.
3. `POST /api/videos` takes `postToFacebook: boolean` (zod, default false). When true, `after(() => postVideoToFacebook(id))` runs after the response, so a Facebook outage never fails an upload.
4. Owner panel on the video page: **"Post to Facebook"** button (retry, or post an older video). Once posted it shows "Posted on Facebook" with a link to the post. Friendly errors ("Could not post. Try again.", "Facebook login expired: make a new token"), never raw errors.
5. Deleting a video also tries to delete its Facebook post (best effort, logged; the row is already gone). If that fails the owner removes the post on Facebook.

**Link preview (new, needed for the card to look right):** the video page has no Open Graph tags today.
- `generateMetadata` adds `og:title`, `og:description` (description snippet) and `og:image`.
- `og:image` points to a new route `GET /api/videos/[id]/share-image` that streams the thumbnail **only for public, ready videos**. Anything else is 404, so a members-only thumbnail never leaks to link scrapers. The Supabase bucket is private, so a signed link would expire; this route is stable.
- A members-only page gets `og:title` only (the locked card already shows the title), no image, no description.

**Members-only videos (owner decides, see question 1).** My recommendation: the upload checkbox "Post on Facebook" is on by default for **public** videos and off for members-only; the owner can still tick it for a members-only video as a teaser (title + link, no picture, the link leads to the locked page with "Request to join").

**Env:** `SITE_URL` (new, server-side, no trailing slash), `FB_PAGE_ID`, `FB_PAGE_TOKEN` (already in `.env.example`; the comment there says "Phase 8a" and gets fixed to 9a). Only `lib/facebook.ts` and the API routes touch the token.

**Owner setup (I give click-by-click steps when we get there; I never see the values):**
1. Meta for Developers: create an app (type Business) and add the Pages API. Your own Facebook account must be an admin of the Page.
2. In the Graph API Explorer, make a user token with `pages_show_list` and `pages_manage_posts`, turn it into a long-lived token, then read the Page's own token from `/me/accounts`. A Page token made this way does not expire.
3. Put `FB_PAGE_ID`, `FB_PAGE_TOKEN` and `SITE_URL` in `.env.local` (and later in Vercel).

**Risks and limits, checked first before the rest is built**
- **Not sure yet:** a Meta app in Development mode may publish posts that only people with a role on the app can see. If so, the app must be switched to Live (needs a privacy-policy URL; for posting to your own Page by an admin, app review should not be required, but I have not confirmed this). I check Meta's current docs and one real test post **before** building the rest, and report if this blocks us.
- The test post goes to your real Page, so I ask first and delete it right after.
- The Graph API version in the URL changes over time. I check the current one when building, and keep it in one constant.
- Facebook caches link previews. If the thumbnail or title changes later, the old post keeps the old card (the owner can refresh it in Facebook's Sharing Debugger).
- Changing a video from public to members-only after posting does not remove the post.

**Tests (no real keys):** message builder (title only, long description cut, no description), Graph error mapping (expired token vs. other), `postToFacebook` zod body, share-image gate (public yes; members, missing and not-ready no).

**PRs (each under 300 lines):** (1) migration + `lib/facebook.ts` + tests + share image route + Open Graph tags; (2) upload checkbox + `after()` post + owner panel button + delete cleanup + `.env.example`.

**Open questions (owner):**
1. Members-only videos: post a teaser by default, never post them, or my recommendation above (off by default, tick it per upload)?
2. Which Facebook Page, and is your account an admin of it? (open since the first plan)
3. Is the deploy allowed now? Without it the code is ready but I can't run a real post.

**Done when:** with the keys and a public site address set, saving a public video with the box ticked puts a post with a title, link and picture on the Page; the button posts an older video and never posts one twice; deleting the video removes the post; a members-only video's thumbnail is not available to anyone who is not allowed to see it.

## Portfolio page — "who I am", art-directed scroll site (2026-11-18, APPROVED by owner: "ok"; questions 4 and 5 not answered yet, so: placeholder shell and placeholder text)

History: (1) first asked for a portfolio page; (2) owner said it is about the owner only, no videos; (3) owner then pasted a long spec of another site (a racing driver's one-page site) and said "do like this, only the portfolio page". Owner's choices: **everything including the WebGL portrait**, **light colour scheme** like the reference, **placeholder photos now**.

This replaces the earlier plan for this page. The small page already built on branch `feat/portfolio-page` (uncommitted; `portfolio-content.ts`, `portfolio-links.tsx`, `portfolio/page.tsx`, one nav link) is the starting point and gets replaced piece by piece.

### What is and is not taken from the reference
- **Taken:** the structure and the feel: a light page, a big name, blocks that pin and recede as the next one covers them, letter-by-letter text, a journey timeline with a progress rail, an animated contour-line backdrop, a chequered seam between blocks, a depth-parallax portrait with a cursor-trail reveal, a sign-off footer. Written fresh as our own code (the project rule: "our own CSS build, not a copy").
- **Not taken:** the driver's photos, the team and sponsor logos and names, the other site's file storage (nothing is hot-linked; every asset lives in `public/portfolio/`), and its artwork data (the circuit outline, the 8,004-dot map, the helmet model). Our own versions replace them (see "The season block" and "The WebGL scene").
- **Not a single HTML file:** it is a Next.js page in this project, with our usual rules (TypeScript, no `any`, components under 200 lines, colours only from tokens in `globals.css`).

### The page (placeholders where the owner's own text and photos go)
1. **Hero:** masthead (logo, centred nav, burger sheet on phones), the owner's name at display size, an id line, three meta rows, two bracket panels ("now" and "quick facts") and a foot row of links, over the WebGL portrait scene. A loading veil lifts when the scene is ready.
2. **"This year so far":** first dark block. Chequered seam from the hero, a dot-halftone map, dashed grid axes, a hub with a ping, and a route line that draws itself clockwise in one 6 s lap, lighting four milestone markers; afterwards the cursor becomes a reticle over the dots.
3. **"My journey":** seven plates (year, photo, short text) on near-black, a rail with a progress thread and a turning square, three parallax layers per row, years that assemble letter by letter, hover dims the other rows.
4. **"Lately":** back to light: latest update text, a dark button, the portrait melting into a dark band that carries a five-item "what's next" strip with crawling dashed connectors and a pulsing live item.
5. **Sign-off footer:** cyan edge with a near-black panel, contour lines in white, the figure riding back into place at the page bottom, nav column, legal row.

### Fixed decisions (from the reference, adapted to this project)
- **Scoped theme, not site-wide:** new tokens in `globals.css` under a `.portfolio-theme` scope (ground `#f7fafb`, ink `#090a0b`, one cyan accent `#02d2e3`, panel and hairline tones). The feed keeps the dark mint viewfinder tokens untouched.
- **Fonts:** Oswald (already loaded) for display; **Space Grotesk added** for this page's text, loaded with `next/font` in the portfolio layout only.
- **Own layout:** the root layout puts every page inside the site header and the fixed viewfinder frame. The portfolio needs neither, so PR 1 moves that chrome into a `(site)` route group (pure file moves) and the portfolio gets its own `(portfolio)` layout and its own masthead. Existing URLs do not change.
- **No global side effects:** the reference scales the page's root font size with the viewport. That would change the whole site, so here the page sizes itself with container units (`cqw`) inside its own wrapper, and the root font size is left alone. Lenis (smooth scroll) and the shared animation loop start on this page only and stop when the owner leaves it.
- **Motion engine, ours:** one shared animation loop (ticker), a small spring solver, scroll triggers, in-view gates, a text reveal that keeps a hidden plain-text copy for screen readers, the sticky stack (blocks pin; the covered one scales to 0.9 and darkens), all under `src/lib/motion/` with unit tests for the spring and the trigger maths. `prefers-reduced-motion`: no Lenis, text and blocks appear at once, the scene draws its settled frame once.
- **New dependencies:** `three` (loaded only on this page, by dynamic import) and `lenis`. Both pinned.
- **Content in one typed file** (`src/lib/portfolio-content.ts`): name, id, meta rows, panels, journey entries, upcoming items, sign-off, links. It ships with clearly marked placeholders.

### The season block — our own artwork
The reference's circuit and map are another site's artwork, so they are not copied. Ours: a **milestones route**, a smooth closed path with four markers (drawn by me, replaceable), and a **halftone built at runtime** by rasterising a shape into a dot lattice (default: the site wordmark; the owner can supply an SVG shape later). The lap timing, glow, markers, chequer reticle and the 24-px chequered seam are re-implemented.

### The WebGL scene — what needs the owner's files
- Needs: a **cut-out portrait** of the owner plus maps derived from it (diffuse, depth, alpha, normal; a script generates the depth, alpha and normal maps), and an **object worn over the portrait** that is burned away and then revealed by the cursor trail (the reference uses a helmet model).
- **Placeholders now:** a generated silhouette portrait set, and a simple procedural shell as the worn object, both under `public/portfolio/scene/`. Real photo and a Draco-compressed `object.glb` drop in later with no code change (the loader reads fixed file names).
- Scene features: device tiers (desktop / tablet / mobile with cheaper settings), entrance rise, crown-to-chin burn with a glowing front, cursor-trail liquid reveal, wireframe wave, contour backdrop shader, helmet-style tilt on the pointer, no-WebGL fallback image, a visible banner if an asset fails to load.
- **Cannot be fully judged without the real photo.** Until then the scene is checked for running, frame time and fallbacks, not for looks.

### PRs (CLAUDE.md says each under 300 lines, so this is a stack of small ones)
1. `chore: split app layouts` — `(site)` route group with the current chrome, root layout keeps fonts, Clerk and providers. Moves only.
2. `feat: portfolio theme tokens and motion engine` — scoped tokens, Space Grotesk, ticker, spring, scroll trigger, in-view hook, Lenis, tests.
3. `feat: text reveal and sticky stack` — reveal component, stack wrapper, recede maths, tests.
4. `feat: portfolio masthead and loading veil` — nav, burger sheet, veil.
5. `feat: portfolio hero (no scene)` — identity, bracket panels, foot row, entrance timings.
6. `feat: contour backdrop and chequered seam` — marching-squares canvas, dissolve canvas.
7. `feat: season block` — route trace, halftone, reticle, plate.
8. `feat: journey timeline` — rail, plates, parallax rows, hover dim.
9. `feat: lately block` — update text, button, band, calendar strip.
10. `feat: sign-off footer`.
11. `feat: scene foundation` — tier module, wrapper, head plane, placeholder assets script.
12. `feat: scene helmet reveal` — burn, trail mask, wireframe wave, tilt.
13. `feat: scene backdrop and fallbacks` — backdrop shader, no-WebGL image, load-error banner.
Each PR leaves the site working. `/portfolio` shows the simple page until PR 5 replaces it. The scene files are split into modules (params, shaders, tier, scene) so each stays under the size rules.

### Checks per PR
Lint, typecheck, tests, build (**CI runs it on Node 22; this machine has Node 24 and the build crashes locally in webpack, so I cannot run it here**); a look at `/portfolio` at desktop width and at the narrowest the browser allows; no sideways scroll; reduced-motion check on the motion PRs; for the scene PRs, frame time on this machine and the no-WebGL fallback.

### Risks and limits
- It is a large build (about 13 PRs). Each step is shippable, and the owner can stop after any PR.
- The page is light while the rest of the site is dark; the feed and `/portfolio` will look like two different sites. That was the owner's choice; a link back to the feed sits in the masthead.
- three.js adds weight only to this page. Low-power phones get the cheap tier or a still image.
- The placeholder scene will not look like the reference until the real photo and object arrive.
- The pending "Rename to Backroom" plan changes the site name; the portfolio masthead logo reads the name from the content file so it can follow.

### Open questions (owner)
1. OK on this plan, including the ~13-PR stack?
2. OK to move the current layout chrome into a `(site)` route group (PR 1, files only move)?
3. OK to add Space Grotesk (this page only), `three` and `lenis`?
4. The worn object: placeholder shell now, and you send a 3D model later (or tell me what object you want, e.g. a camcorder to match the site)?
5. The real text for the page: name, id line, 3 meta rows, "now" panel, 3 quick facts, up to 7 journey entries (year + 1–2 sentences), 5 "what's next" items, a sign-off line, and your links.

**Done when:** a visitor opens `/portfolio` and sees the full scroll site in your own words and photos: hero with the portrait scene and loading veil, the season block, the journey, the "lately" block and the footer; it works on phone and desktop, respects reduced motion, falls back without WebGL, leaves the feed and header untouched, and lint, typecheck, tests and build pass in CI.

## Rename to "Backroom" (2026-11-18, WAITING FOR OWNER OK)

Owner asked: change the name to **"Backroom"**, slogan **"where the real talk happens"**. Text only: no database, no API, no new files.

**What changes**
1. **Header logo** (`site-header.tsx`): `Experience.` becomes `Backroom.` (same mono, uppercase, mint dot).
2. **Browser tab titles:** `layout.tsx` title becomes `Backroom`; every `… · Experience Community` becomes `… · Backroom` (13 pages: sign-in, join, sso-callback, search, upload, admin/members, video page, portfolio, 5 settings pages).
3. **Descriptions:** `layout.tsx` description becomes the slogan, "Where the real talk happens."; the portfolio description says "on Backroom".
4. **Home hero** (`tv-wall-hero.tsx`): the big title "Experiences on tape" becomes `Backroom`, with the slogan "Where the real talk happens." directly under it. The paragraph under that ("Work, life, trading and code…") stays.
5. **`README.md`** title becomes `Backroom`.

**Stays as is**
- The feed heading "Experiences" (`(feed)/page.tsx`): it names the videos, not the site.
- Repo, folder and bucket names (`no-name`, `no-name-videos`) and the Clerk app name `no-name`: internal. Renaming the Clerk app (it can show in sign-in emails) is a dashboard click for the owner; I can give the steps if wanted.
- `CLAUDE.md`: it never names the site.

**PR (one, about 20 changed lines):** `feat/rename-backroom`. Check: lint, typecheck, build; look at the home hero at desktop width and 390 px (the title must not wrap badly), and a tab title.

**Open questions (owner):**
1. Hero as in item 4 (title `Backroom`, slogan under it)? Or keep "Experiences on tape" and show the slogan only in the header and tab titles?
2. Slogan capital: "Where the real talk happens." (my default) or all lowercase as you wrote it?
3. Branch: the portfolio work is uncommitted on `feat/portfolio-page` and also contains the old name. I suggest finishing and merging the portfolio PR first, then doing the rename from `main`. OK?

**Done when:** no visible "Experience Community" is left, the header shows Backroom., and the slogan shows on the home hero.
