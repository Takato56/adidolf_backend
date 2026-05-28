import { createClient, SupabaseClient} from "@supabase/supabase-js";
import { env } from "./env.config.js";

let instance: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient => {
    if (instance) return instance;

    instance = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

    return instance;
}

export const supabase = getSupabaseClient();