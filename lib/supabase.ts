
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wipafzqjwewbajrlqdee.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndpcGFmenFqd2V3YmFqcmxxZGVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxMTMyMDYsImV4cCI6MjA4NTY4OTIwNn0.wzvEBDogjJgJG0G49OFgU394vvOq3eqS2_uoIkClPjY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
