// whitelist.js — backed by Supabase so data survives Railway redeploys
//
// Required env vars:
//   SUPABASE_URL      — e.g. https://okshteetxmmphgjgvrwt.supabase.co
//   SUPABASE_SERVICE_KEY — your project's service_role secret key (NOT the anon key)

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('⚠️  SUPABASE_URL or SUPABASE_SERVICE_KEY missing — whitelist will not persist!')
}

// Minimal fetch wrapper so we don't need the full supabase-js client
async function query(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase error (${res.status}): ${err}`)
  }

  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// ─── Public API ────────────────────────────────────────────────────────────

export async function isApproved(number) {
  try {
    const rows = await query(`bot_whitelist?number=eq.${encodeURIComponent(number)}&select=number`)
    return Array.isArray(rows) && rows.length > 0
  } catch (err) {
    console.error('isApproved error:', err.message)
    return false
  }
}

export async function addStudent(number, school = 'YSJ', country = '') {
  try {
    await query('bot_whitelist', {
      method: 'POST',
      // upsert so re-adding doesn't blow up
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ number, school, country }),
    })
  } catch (err) {
    console.error('addStudent error:', err.message)
  }
}

export async function removeStudent(number) {
  try {
    const rows = await query(`bot_whitelist?number=eq.${encodeURIComponent(number)}`, {
      method: 'DELETE',
    })
    return Array.isArray(rows) && rows.length > 0
  } catch (err) {
    console.error('removeStudent error:', err.message)
    return false
  }
}

export async function getStudent(number) {
  try {
    const rows = await query(`bot_whitelist?number=eq.${encodeURIComponent(number)}&select=*`)
    return rows?.[0] || null
  } catch (err) {
    console.error('getStudent error:', err.message)
    return null
  }
}

export async function getAllStudents() {
  try {
    const rows = await query('bot_whitelist?select=*&order=added_at.asc')
    // Return same shape as the old JSON file: { [number]: { school, country, addedAt } }
    return Object.fromEntries(
      (rows || []).map(r => [r.number, { school: r.school, country: r.country, addedAt: r.added_at }])
    )
  } catch (err) {
    console.error('getAllStudents error:', err.message)
    return {}
  }
}

export async function getCount() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/bot_whitelist?select=number`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'count=exact',
        'Range-Unit': 'items',
        Range: '0-0',
      },
    })
    const range = res.headers.get('content-range') // e.g. "0-0/42"
    return range ? parseInt(range.split('/')[1], 10) : 0
  } catch (err) {
    console.error('getCount error:', err.message)
    return 0
  }
}
