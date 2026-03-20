import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://areunmxglcyllqtyfcqk.supabase.co";
const supabaseAnonKey = "sb_publishable_ZxhaqXrMZ-mY6xYNOrUtbQ_XgtFNMEK";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
