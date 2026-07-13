import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.config';

let instance: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient => {
    if (instance) return instance;

    instance = createClient(
        env.SUPABASE_URL,
        env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    return instance;
};

export const supabase = getSupabaseClient();
