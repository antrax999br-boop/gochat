import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xrtotjysabtnbckwkutl.supabase.co';
const supabaseAnonKey = 'sb_publishable_s5Qt3Jt70Xgp5Tz3GIGvQQ_U6LuKUWo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
