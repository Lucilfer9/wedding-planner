import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jkbcdgqpoorjrwbsgxyl.supabase.co'
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYmNkZ3Fwb29yanJ3YnNneHlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIxODY5ODUsImV4cCI6MjEwNzc2Mjk4NX0.eBRWth-fNv_NnZG4vqD-UflglB70cHq4YlVYTb3Ciuc'

export const supabase = createClient(supabaseUrl, supabaseKey)
