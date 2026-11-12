# CLAUDE.md

Community site where the owner uploads videos of their experiences. Visitors sign in, watch, like, comment and rate (1–5 stars).

## Working rules (from the owner — always follow)

1. **Plan first.** Before writing code for any feature, write or update a plan in `NOTES/PLAN.md` and get the owner's OK.
2. **Handoff notes.** At the end of every session (or when stopping mid-task), write a note in `NOTES/` named `YYYY-MM-DD-handoff.md`: what was done, what is half-done, what is next, any open questions.
3. **No Claude co-author.** Never add `Co-Authored-By: Claude ...` or "Generated with Claude Code" lines to commits or PRs.
4. Read `NOTES/PLAN.md` and the newest handoff note before starting work.

## Stack (from the Pinebaatars stack docs)

| Service                                                  | Job here                                                                      |
| -------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Next.js (App Router) + TypeScript + Tailwind + shadcn/ui | pages + API routes                                                            |
| Clerk                                                    | sign in; read `userId` on the server with `auth()`. Supabase Auth stays OFF   |
| Supabase                                                 | Postgres + Storage (video files, thumbnails)                                  |
| Drizzle                                                  | typed queries, schema in `src/db/schema.ts`                                   |
| Groq (free plan)                                         | whisper-large-v3 transcripts (replaces Hugging Face, which is no longer free) |
| Pinecone                                                 | search by meaning; integrated `multilingual-e5-large` embeddings (1024 dims)  |
| n8n                                                      | background jobs (transcribe after upload) with secret webhook header          |
| Wire.mn / Facebook Graph API                             | later phases only (see plan)                                                  |

## Folder structure

```
src/
  app/            pages and API routes
    api/          server endpoints, one folder per feature
  components/     UI pieces, one per file
  db/
    schema.ts     Drizzle tables
    index.ts      db connection
  lib/            service clients (supabase.ts, groq.ts, pinecone.ts, wire.ts)
  types/          shared TS types
NOTES/            plans + handoff notes
.env.example      keys, no values
```

Only `lib/` and `app/api/` touch secret keys. Components never do.

## Coding rules

- No `any`. Names say what the thing is (`videos`, `isLoading`, `saveComment()`).
- Return early. One component per file, under 200 lines.
- Check every request body with `zod` on the server.
- Wrap outside-service calls in try/catch; show friendly messages ("Could not save. Try again."), never raw errors.
- No `console.log` in commits.

## Tooling

- Node 22 LTS. Scripts: `npm run lint`, `npm run typecheck` (`tsc --noEmit`), `npm run format`, `npm run build`.
- ESLint: next core-web-vitals + typescript + prettier; `no-explicit-any`, `no-unused-vars`, `eqeqeq`, `prefer-const` = error; `no-console` = warn (allow `error`).
- Prettier: `{ "singleQuote": true, "semi": true, "printWidth": 100, "trailingComma": "all" }`.
- Husky + lint-staged pre-commit: `*.{ts,tsx}` → `eslint --fix`, `prettier --write`.
- CI (`.github/workflows/ci.yml`) on PRs to `main`: `npm ci`, lint, typecheck, build.

## Git

- Branch `type/short-name` (e.g. `feat/video-upload`). Commit `type: what changed`. Types: feat, fix, refactor, docs, chore.
- PRs under 300 lines, with what + why + screenshot. Protect `main`.

## Design

Dark UI. Near-black background, subtle 1px borders, rounded cards, one mint-green accent, Inter + a mono font for code/meta.
Video feed is a grid of large thumbnail cards (like getlayers.ai's template gallery): thumbnail, title, like count, star average, filter chips above the grid.
Tokens live in `src/app/globals.css` as CSS variables. Do not hardcode colors in components.
