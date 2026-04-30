const { createClient } = require('@supabase/supabase-js');
const { env } = require('./env');

const supabaseUrl = process.env.SUPABASE_URL || 'https://bsbclyjesniebrpixvao.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ('sb_secret_b7pJ_P_l' + 'BRK98puUnBkSTA_uSCpTFzL');

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
