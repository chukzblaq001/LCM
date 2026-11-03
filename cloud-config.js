// PUBLIC client settings only. Never place Supabase service-role or OpenAI API keys here.
export const SUPABASE_URL = "https://tzndefnwvezzbzghgiui.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_Ov17PFOgNcu8fxxBDZOAzA_cwrM5emr";
export const CLOUD_ENABLED = !SUPABASE_URL.includes("YOUR-PROJECT-REF") && !SUPABASE_PUBLISHABLE_KEY.startsWith("YOUR_");
