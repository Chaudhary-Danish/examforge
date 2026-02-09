
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listColumns() {
    console.log('🔍 Listing Columns in "students" table...');

    // We can't query information_schema easily with js client, 
    // so we'll fetch one row and print the keys.
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error.message);
    } else if (data && data.length > 0) {
        console.log('✅ Found columns:', Object.keys(data[0]));
        console.log('Sample Row:', data[0]);
    } else {
        console.log('⚠️ Table is empty, cannot infer columns.');
    }
}

listColumns();
