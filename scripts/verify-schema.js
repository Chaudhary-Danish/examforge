
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load env vars
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase URL or Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('🔍 Checking Database Schema...');

    // Try to insert a row with subject_id to see if it fails
    // We'll use a transaction validation workaround since we can't select columns easily

    // Actually, just selecting from the table should tell us if the cache is stale or if it works?
    // No, select * returns what is there.
    // We need to try to filter by subject_id or order by it?

    // Better: Attempt a dry-run insert that we know will fail on constraint but pass on column existence,
    // OR just try to select the column specifically.

    const { error } = await supabase
        .from('ai_conversations')
        .select('subject_id')
        .limit(1);

    if (error) {
        if (error.message.includes('does not exist')) {
            console.error('\n❌ FAIL: The column "subject_id" is MISSING in "ai_conversations" table.');
            console.error('👉 YOU MUST RUN THE "FIX_DB.sql" SCRIPT IN SUPABASE DASHBOARD.');
        } else {
            console.error('\n❌ Error checking schema:', error.message);
        }
    } else {
        console.log('\n✅ SUCCESS: The "subject_id" column exists!');
        console.log('🚀 You can now restart your app.');
    }
}

checkSchema();
