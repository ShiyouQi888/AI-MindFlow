import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

// Validate URL format to prevent crash
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

const isConfigured = supabaseUrl && 
                   supabaseAnonKey && 
                   supabaseUrl !== 'your_supabase_project_url' &&
                   isValidUrl(supabaseUrl);

if (!isConfigured) {
  console.warn('Supabase is not properly configured. Database features will be disabled. Please check your .env file.');
}

// Use a valid dummy URL if not configured to prevent library from throwing on init
const finalUrl = isConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co';
const finalKey = isConfigured ? supabaseAnonKey : 'placeholder-key';

export const supabase = createClient(finalUrl, finalKey);

// Export a helper to check if Supabase is actually usable
export const isSupabaseConfigured = isConfigured;

