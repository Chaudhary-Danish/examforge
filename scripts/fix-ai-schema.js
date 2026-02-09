
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
    console.error('Missing Supabase URL or Service Role Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixSchema() {
    console.log('Fixing AI Conversations Schema...');

    // 1. Add subject_id column to ai_conversations if not exists
    // We strictly use SQL execution via rpc or just raw query if possible. 
    // Since we don't have direct SQL access easily via JS client without a specific function,
    // we will try to use the 'rpc' method if a 'exec_sql' function exists, 
    // OR we will provide the SQL for the user to run in the dashboard SQL editor.

    // HOWEVER, for this environment, we might rely on the fact that the user might have an 'exec_sql' function
    // or we can't run it.

    // WAIT: The supabase-js client cannot alter table structure directly unless we use the stored procedure trick.
    // Let's create a SQL file instead that the user can run.

    const sql = `
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_conversations' AND column_name = 'subject_id') THEN
            ALTER TABLE ai_conversations ADD COLUMN subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added subject_id column to ai_conversations';
        ELSE
            RAISE NOTICE 'subject_id column already exists';
        END IF;
    END $$;
    `;

    console.log('\nPlease run the following SQL in your Supabase Dashboard > SQL Editor:\n');
    console.log(sql);
}

fixSchema();
