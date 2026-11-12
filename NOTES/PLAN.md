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
- Embeddings use `paraphrase-multilingual-MiniLM-L12-v2`, which covers Mongolian and English. A search in English can find a Mongolian video and the other way round.
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
