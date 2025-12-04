// supabaseClient.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'

const supabaseUrl = 'https://jkiwfvolipgttkyxcndc.supabase.co'  // ← cambia por tu URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraXdmdm9saXBndHRreXhjbmRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNzIyODksImV4cCI6MjA3OTg0ODI4OX0.lBGeIM4w6Gzy3dopkZMMAGr3_9uL1JHRRxq5URUhZEU'             // ← cambia por tu anon key

export const supabase = createClient(supabaseUrl, supabaseAnonKey)