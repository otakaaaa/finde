#!/usr/bin/env node
/**
 * ローカル Supabase の Storage バケットを Storage API 経由で作成するスクリプト
 * 使い方: node scripts/setup-storage.js
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? 'http://127.0.0.1:54321'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set.')
  console.error('Run: export SUPABASE_SERVICE_ROLE_KEY=$(npx supabase status -o env | grep SERVICE_ROLE_KEY | cut -d= -f2 | tr -d \'"\' )')
  process.exit(1)
}

const BUCKETS = [
  {
    id: 'shop-photos',
    name: 'shop-photos',
    public: true,
    fileSizeLimit: 10 * 1024 * 1024, // 10 MiB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
]

async function createBucket(bucket) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bucket),
  })

  const body = await res.json()

  if (res.ok) {
    console.log(`✓ Bucket "${bucket.id}" created`)
    return
  }

  if (body.error === 'Duplicate') {
    console.log(`- Bucket "${bucket.id}" already exists, updating...`)

    const upRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${bucket.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes,
      }),
    })

    if (upRes.ok) {
      console.log(`✓ Bucket "${bucket.id}" updated`)
    } else {
      const upBody = await upRes.json()
      console.error(`✗ Failed to update bucket "${bucket.id}":`, upBody)
    }
    return
  }

  console.error(`✗ Failed to create bucket "${bucket.id}":`, body)
}

for (const bucket of BUCKETS) {
  await createBucket(bucket)
}

console.log('Done.')
