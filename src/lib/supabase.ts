import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local')
}

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})
