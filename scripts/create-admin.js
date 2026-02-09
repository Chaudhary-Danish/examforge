// Run this script to create the initial admin account
// Usage: node scripts/create-admin.js

const bcrypt = require('bcryptjs')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function createAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials in .env')
        process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Admin credentials - CHANGE THESE!
    const adminEmail = 'admin@examforge.app'
    const adminPassword = 'admin.owner' // Change this!
    const adminName = 'System Administrator'

    console.log('🔐 Creating admin account...')

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10)

    // Check if admin exists
    const { data: existing } = await supabase
        .from('admin')
        .select('id')
        .eq('email', adminEmail)
        .single()

    if (existing) {
        console.log('⚠️  Admin already exists. Updating password...')
        await supabase
            .from('admin')
            .update({ password_hash: passwordHash })
            .eq('email', adminEmail)
    } else {
        // Create admin
        const { error } = await supabase
            .from('admin')
            .insert({
                email: adminEmail,
                password_hash: passwordHash,
                full_name: adminName
            })

        if (error) {
            console.error('❌ Failed to create admin:', error.message)
            process.exit(1)
        }
    }

    console.log('✅ Admin account ready!')
    console.log('')
    console.log('📧 Email:', adminEmail)
    console.log('🔑 Password:', adminPassword)
    console.log('')
    console.log('⚠️  Make sure to change the password in production!')
}

createAdmin().catch(console.error)
