
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

async function moveStudent() {
    console.log('🔄 MOVING STUDENT TO IT DEPARTMENT...\n');

    // 1. Find IT Department
    const { data: dept } = await supabase
        .from('departments')
        .select('id, name')
        .eq('code', 'IT') // Assuming code is IT
        .single();

    if (!dept) {
        console.error('❌ IT Department not found. (Check code?)');
        return;
    }
    console.log(`✅ Target Dept: ${dept.name}`);

    // 2. Find Semester 2 in IT
    // Dept -> Year (SY) -> Semester (Sem 2)
    const { data: years } = await supabase
        .from('years')
        .select('id')
        .eq('department_id', dept.id)
        .eq('name', 'Second Year') // Assuming Second Year
        .single();

    if (!years) {
        console.error('❌ Second Year not found in IT.');
        return;
    }

    const { data: semester } = await supabase
        .from('semesters')
        .select('id, name')
        .eq('year_id', years.id)
        .ilike('name', '%Semester 2%')
        .single();

    if (!semester) {
        console.error('❌ Semester 2 not found in IT.');
        return;
    }
    console.log(`✅ Target Semester: ${semester.name} (ID: ${semester.id})`);

    // 3. Update ALL Students to this Semester (Forcing the fix)
    const { error } = await supabase
        .from('students')
        .update({
            department_id: dept.id,
            year_id: years.id,
            semester_id: semester.id
        })
        .neq('id', '00000000-0000-0000-0000-000000000000') // Dummy filter to update all

    if (error) {
        console.error('❌ Update Failed:', error.message);
    } else {
        console.log('✅ SUCCESS: All students moved to IT - Semester 2.');
    }
}

moveStudent();
