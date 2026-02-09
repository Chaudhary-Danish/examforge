
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

async function auditStudents() {
    console.log('🔍 AUDITING ALL STUDENT ASSIGNMENTS...\n');

    // 1. Get ALL Students
    const { data: students, error } = await supabase
        .from('students')
        .select('*');

    if (error) {
        console.error('❌ Error fetching students:', error.message);
        return;
    }

    console.log(`found ${students.length} students.`);

    for (const student of students) {
        // 2. Get Semester & Department for each
        if (!student.semester_id) {
            console.log(`👤 Student ID: ${student.id} (User ID: ${student.user_id})`);
            console.log(`   ❌ NO SEMESTER ASSIGNED`);
            continue;
        }

        const { data: sem, error: semErr } = await supabase
            .from('semesters')
            .select(`
                name,
                year:years (
                    name,
                    department:departments (
                        name,
                        code
                    )
                )
            `)
            .eq('id', student.semester_id)
            .single();

        if (semErr) {
            console.error(`   ❌ Error fetching semester ${student.semester_id}`);
            continue;
        }

        const dept = sem.year.department;
        const deptCode = dept.code;

        console.log(`👤 Student ID: ${student.id} (User ID: ${student.user_id})`);
        console.log(`   - Assigned To: ${dept.name} (${deptCode})`);
        console.log(`   - Semester: ${sem.name} (${sem.year.name})`);

        if (deptCode === 'CS') {
            console.log('   ⚠️  This student is in CS Department.');
        } else if (deptCode === 'IT') {
            console.log('   ✅ This student is in IT Department.');
        } else {
            console.log(`   ℹ️  This student is in ${deptCode} Department.`);
        }
        console.log('---');
    }
}

auditStudents();
