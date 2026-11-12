import 'server-only';
import { z } from 'zod';

// The index embeds `chunk_text` itself (multilingual-e5-large), so we only send text.
// It has a document schema, which needs the documents API (2026-07+). Plain fetch, no SDK.
const API_VERSION = '2026-07';
const NAMESPACE = 'videos';

export type VideoDocument = { id: string; videoId: string; text: string };
export type DocumentMatch = { id: string; videoId: string; text: string; score: number };

const IndexDescription = z.object({ host: z.string() });
const SearchResponse = z.object({
  matches: z.array(
    z.object({
      _id: z.string(),
      _score: z.number(),
      videoId: z.string(),
      chunk_text: z.string(),
    }),
  ),
});
const ListResponse = z.object({
  documents: z.array(z.object({ _id: z.string() })).default([]),
  pagination: z.object({ next: z.string().optional() }).optional(),
});

function apiKey(): string {
  const key = process.env.PINECONE_API_KEY;
  if (!key) throw new Error('PINECONE_API_KEY is not set. See .env.example.');
  return key;
}

const headers = () => ({
  'Api-Key': apiKey(),
  'X-Pinecone-API-Version': API_VERSION,
  'content-type': 'application/json',
});

let indexHost: Promise<string> | undefined;

/** The index's data-plane host. PINECONE_INDEX may be the index name or its https host. */
function getIndexHost(): Promise<string> {
  indexHost ??= (async () => {
    const indexName = process.env.PINECONE_INDEX;
    if (!indexName) throw new Error('PINECONE_INDEX is not set. See .env.example.');
    if (indexName.startsWith('https://')) return indexName.replace(/\/$/, '');
    const response = await fetch(`https://api.pinecone.io/indexes/${indexName}`, {
      headers: headers(),
    });
    if (!response.ok) throw new Error(`Pinecone describe failed: ${response.status}`);
    return `https://${IndexDescription.parse(await response.json()).host}`;
  })().catch((error: unknown) => {
    indexHost = undefined; // retry on the next call
    throw error;
  });
  return indexHost;
}

async function callDocuments(action: string, body: unknown): Promise<unknown> {
  const host = await getIndexHost();
  const response = await fetch(`${host}/namespaces/${NAMESPACE}/documents/${action}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Pinecone ${action} failed: ${response.status} ${await response.text()}`);
  }
  return response.json();
}

/** Adds or replaces documents (same id = replace). */
export async function upsertDocuments(documents: VideoDocument[]): Promise<void> {
  // Pinecone caps one upsert at 96 documents when it embeds them.
  for (let start = 0; start < documents.length; start += 96) {
    await callDocuments('upsert', {
      documents: documents.slice(start, start + 96).map(({ id, videoId, text }) => ({
        _id: id,
        videoId,
        chunk_text: text,
      })),
    });
  }
}

/** Closest documents to the query text, best first. */
export async function searchDocuments(query: string, topK: number): Promise<DocumentMatch[]> {
  const result = SearchResponse.parse(
    await callDocuments('search', {
      score_by: [{ type: 'embed', field: 'chunk_text', query }],
      top_k: topK,
      include_fields: ['videoId', 'chunk_text'],
    }),
  );
  return result.matches.map((match) => ({
    id: match._id,
    videoId: match.videoId,
    text: match.chunk_text,
    score: match._score,
  }));
}

/** Removes every document of one video (ids start with `{videoId}#`). */
export async function deleteVideoDocuments(videoId: string): Promise<void> {
  let paginationToken: string | undefined;
  do {
    const page = ListResponse.parse(
      await callDocuments('list', {
        prefix: `${videoId}#`,
        limit: 100,
        ...(paginationToken && { pagination_token: paginationToken }),
      }),
    );
    const ids = page.documents.map((document) => document._id);
    if (ids.length > 0) await callDocuments('delete', { ids });
    paginationToken = page.pagination?.next;
  } while (paginationToken);
}
