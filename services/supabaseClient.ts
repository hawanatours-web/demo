
import { createClient } from '@supabase/supabase-js';
import { supabaseConfig } from '../supabaseConfig';

const supabaseUrl = supabaseConfig.supabaseUrl;
const supabaseAnonKey = supabaseConfig.supabaseAnonKey;

if (!supabaseUrl || supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('Supabase URL is using placeholder. The app is running in Demo Mode (Offline).');
}

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey
);