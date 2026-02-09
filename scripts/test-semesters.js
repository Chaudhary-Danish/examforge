
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

async function testSemesters() {
    console.log('🔍 TESTING SEMESTERS API LOGIC...\n');

    // 1. Get a Year
    const { data: years, error: yearError } = await supabase
        .from('years')
        .select('id, name, department_id')
        .limit(1);

    if (yearError || !years.length) {
        console.error('❌ Failed to fetch years:', yearError);
        return;
    }

    const year = years[0];
    console.log(`✅ Found Year: ${year.name} (ID: ${year.id})`);

    // 2. Simulate API Call
    console.log('2. Fetching semesters for this year...');

    // Attempt with 'order_index' (Suspicious)
    const { data: semesters, error } = await supabase
        .from('semesters')
        .select('id, name, code, order_index') // <--- Testing this
        .eq('year_id', year.id)
        .order('order_index');

    if (error) {
        console.error('❌ API FAIL (With order_index):', error.message);

        // Retry without order_index
        console.log('   Retrying without order_index...');
        const { data: sem2, error: err2 } = await supabase
            .from('semesters')
            .select('id, name, code')
            .eq('year_id', year.id);

        if (err2) {
            console.error('❌ API FAIL (Basic):', err2.message);
        } else {
            console.log(`✅ API SUCCESS (Basic): Found ${sem2.length} semesters.`);
        }

    } else {
        console.log(`✅ API SUCCESS (With order_index): Found ${semesters.length} semesters.`);
        console.log(semesters);
    }
}

testSemesters();
