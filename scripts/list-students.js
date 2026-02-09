
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

async function listStudents() {
    console.log('🔍 Listing Students...');
    const { data: students, error } = await supabase
        .from('students')
        .select(`id, name, email, semester_id`)
        .limit(10);

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.table(students);
    }
}

listStudents();
