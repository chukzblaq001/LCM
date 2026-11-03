// PUBLIC client settings only. Never place Supabase service-role or OpenAI API keys here.
export const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY";
export const CLOUD_ENABLED = !SUPABASE_URL.includes("YOUR-PROJECT-REF") && !SUPABASE_PUBLISHABLE_KEY.startsWith("YOUR_");
