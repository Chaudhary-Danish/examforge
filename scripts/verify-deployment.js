
async function checkDeployment() {
    const url = 'https://examforgeapp.vercel.app/';
    console.log(`Checking ${url}...`);

    try {
        const res = await fetch(url);
        console.log(`Status: ${res.status}`);
        if (res.ok) {
            console.log('✅ Site is reachable!');
            const text = await res.text();
            console.log(`Content Preview: ${text.slice(0, 100)}...`);
        } else {
            console.error('❌ Site returned error status.');
        }

        // Check API
        const apiUrl = 'https://examforgeapp.vercel.app/api/subjects';
        console.log(`\nChecking API ${apiUrl}...`);
        const apiRes = await fetch(apiUrl);
        console.log(`API Status: ${apiRes.status}`);
        // We expect 401 or 200 with empty array depending on how verifyAuth handles no-token
        // verifyAuth usually returns 401 if no token
    } catch (error) {
        console.error('❌ Failed to fetch:', error.message);
    }
}

checkDeployment();
