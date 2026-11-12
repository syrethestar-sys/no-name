// One-time setup: creates (or updates) the private `videos` bucket.
// Run: npm run storage:setup
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'videos';
const options = {
  public: false,
  fileSizeLimit: '50MB',
  allowedMimeTypes: ['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg'],
};

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

const { data: existing } = await supabase.storage.getBucket(BUCKET);
const { error } = existing
  ? await supabase.storage.updateBucket(BUCKET, options)
  : await supabase.storage.createBucket(BUCKET, options);

if (error) {
  console.error(`Could not set up bucket "${BUCKET}": ${error.message}`);
  process.exit(1);
}
console.log(
  `Bucket "${BUCKET}" ${existing ? 'updated' : 'created'} (private, 50MB, video + jpeg).`,
);
