
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

async function debugData() {
    console.log('🔍 Debugging Data Relationships (Sequential Mode)...\n');

    // 1. Get Student
    const { data: students, error: sErr } = await supabase
        .from('students')
        .select('*')
        .ilike('name', '%Chaudhary Mohd Danish%')
        .limit(1);

    if (sErr || !students.length) {
        console.error('❌ Student not found');
        return;
    }
    const student = students[0];
    console.log(`👤 Student: ${student.name}`);
    console.log(`   - Student ID: ${student.id}`);
    console.log(`   - Student Sem ID: ${student.semester_id}`);

    // 2. Get Student's Semester details
    const { data: sem, error: semErr } = await supabase
        .from('semesters')
        .select('*, year:years(*, department:departments(*))')
        .eq('id', student.semester_id)
        .single();

    if (semErr) {
        console.error('❌ Error fetching student semester:', semErr.message);
    } else {
        const dept = sem.year.department;
        console.log(`   - Student Context: ${dept.name} (${dept.code}) > ${sem.year.name} > ${sem.name}`);

        if (dept.code === 'CS') console.warn('   ⚠️ WARNING: Student is in CS Dept! This explains why they see CS subjects.');
        if (dept.code === 'IT') console.log('   ✅ Student is correctly in IT Dept.');
    }

    console.log('\n----------------------------------------\n');

    // 3. Get "Flutter" Subject
    const { data: subjects, error: subErr } = await supabase
        .from('subjects')
        .select('*')
        .eq('name', 'Flutter');

    if (subErr || !subjects.length) {
        console.error('❌ Subject "Flutter" not found');
        return;
    }
    const flutter = subjects[0];
    console.log(`📚 Subject: ${flutter.name}`);
    console.log(`   - Flutter Sem ID: ${flutter.semester_id}`);

    // 4. Get Flutter's Semester details
    const { data: fSem, error: fSemErr } = await supabase
        .from('semesters')
        .select('*, year:years(*, department:departments(*))')
        .eq('id', flutter.semester_id)
        .single();

    if (fSemErr) {
        console.error('❌ Error fetching subject semester:', fSemErr.message);
    } else {
        const fDept = fSem.year.department;
        console.log(`   - Subject Context: ${fDept.name} (${fDept.code}) > ${fSem.year.name} > ${fSem.name}`);

        // 5. Compare
        if (student.semester_id === flutter.semester_id) {
            console.log('\n🔗 MATCH: Student and Subject share the EXACT SAME Semester ID.');
            console.log('   This means the student IS enrolled in the semester that has Flutter.');
        } else {
            console.log('\n❓ MISMATCH: Student Sem ID != Subject Sem ID.');
            console.log(`   Student: ${student.semester_id}`);
            console.log(`   Subject: ${flutter.semester_id}`);
        }
    }
}

debugData();
