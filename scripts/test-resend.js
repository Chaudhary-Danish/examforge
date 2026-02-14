// Quick Resend email diagnostic test
// Run: node scripts/test-resend.js

require('dotenv').config()

const API_KEY = process.env.RESEND_API_KEY

if (!API_KEY) {
    console.error('❌ RESEND_API_KEY is not set in .env')
    process.exit(1)
}

console.log('🔍 Resend API Key:', API_KEY.substring(0, 10) + '...')

async function testEmail() {
    // Step 1: Verify the API key works by checking domains
    console.log('\n--- Step 1: Checking your Resend account domains ---')
    try {
        const domainsRes = await fetch('https://api.resend.com/domains', {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        })
        const domainsData = await domainsRes.json()
        console.log('Domains response:', JSON.stringify(domainsData, null, 2))

        if (domainsData.data && domainsData.data.length > 0) {
            console.log('\n✅ You have verified domains:')
            domainsData.data.forEach(d => {
                console.log(`   - ${d.name} (status: ${d.status})`)
            })
        } else {
            console.log('\n⚠️  No custom domains verified. You can only send to your own email with onboarding@resend.dev')
        }
    } catch (err) {
        console.error('Failed to fetch domains:', err.message)
    }

    // Step 2: Try sending a test email
    console.log('\n--- Step 2: Sending test email ---')
    const testTo = 'delivered@resend.dev'  // Resend's test address that always succeeds

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'ExamForge <onboarding@resend.dev>',
                to: testTo,
                subject: 'ExamForge Test Email',
                html: '<h1>Test</h1><p>If you see this, Resend is working!</p>'
            })
        })

        const data = await res.json()
        console.log('Status:', res.status)
        console.log('Response:', JSON.stringify(data, null, 2))

        if (res.ok) {
            console.log('\n✅ Email sent successfully to test address!')
            console.log('   Email ID:', data.id)
        } else {
            console.log('\n❌ Email FAILED!')
            console.log('   Error:', data.message || data.error || JSON.stringify(data))

            if (data.message?.includes('verify a domain')) {
                console.log('\n📋 FIX: You need to verify a custom domain in Resend dashboard:')
                console.log('   1. Go to https://resend.com/domains')
                console.log('   2. Add your domain and configure DNS records')
                console.log('   3. Once verified, set RESEND_FROM_EMAIL=ExamForge <noreply@yourdomain.com>')
            }
        }
    } catch (err) {
        console.error('Request failed:', err.message)
    }

    // Step 3: Check API key info
    console.log('\n--- Step 3: Checking API keys ---')
    try {
        const keysRes = await fetch('https://api.resend.com/api-keys', {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        })
        const keysData = await keysRes.json()
        console.log('API Keys:', JSON.stringify(keysData, null, 2))
    } catch (err) {
        console.error('Failed to check keys:', err.message)
    }
}

testEmail()
