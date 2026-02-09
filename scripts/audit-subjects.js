
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

async function auditSubjects() {
    console.log('🔍 AUDITING ALL SUBJECT ASSIGNMENTS...\n');

    const { data: subjects, error } = await supabase
        .from('subjects')
        .select(`
            id,
            name,
            code,
            semester_id,
            semester:semesters (
                id,
                name,
                year:years (
                    id,
                    name,
                    department:departments (
                        id,
                        name,
                        code
                    )
                )
            )
        `)
        .order('name');

    if (error) {
        console.error('❌ Error fetching subjects:', error.message);
        return;
    }

    console.log(`found ${subjects.length} subjects.`);

    for (const subject of subjects) {
        if (!subject.semester) {
            console.log(`📚 Subject: ${subject.name} (${subject.code})`);
            console.log(`   ❌ NO SEMESTER LINKED (Or orphan ID: ${subject.semester_id})`);
            continue;
        }

        const sem = subject.semester;
        const year = sem.year;
        const dept = year.department;

        console.log(`📚 Subject: ${subject.name} (${subject.code})`);
        console.log(`   - Context: ${dept.code} > ${year.name} > ${sem.name}`);
        console.log(`   - Sem ID: ${subject.semester_id}`);

        if (dept.code === 'CS' && subject.name === 'Flutter') {
            console.log('   ✅ Flutter is correctly in CS.');
        } else if (dept.code !== 'CS' && subject.name === 'Flutter') {
            console.log('   ⚠️  FLUTTER IS IN THE WRONG DEPARTMENT!');
        }
        console.log('---');
    }
}

auditSubjects();
