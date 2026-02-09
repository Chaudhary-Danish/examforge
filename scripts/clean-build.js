const fs = require('fs');
const path = require('path');

const nextDir = path.join(process.cwd(), '.next');

// Robust clean function
async function clean() {
    console.log('Cleaning .next directory...');
    for (let i = 0; i < 5; i++) {
        try {
            if (fs.existsSync(nextDir)) {
                fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
                console.log('✅ .next folder deleted.');
            } else {
                console.log('ℹ️ .next folder not found (already clean).');
            }
            return; // Success
        } catch (e) {
            console.error(`⚠️ Attempt ${i + 1}/5 failed: ${e.message}`);
            // Wait 1s before retry
            await new Promise(r => setTimeout(r, 1000));
        }
    }
    console.error('❌ Failed to clean .next directory after 5 attempts. Proceeding anyway (build might fail).');
    // We don't exit(1) because maybe the build can overwrite it? 
    // Actually, if we can't delete it, build usually fails on EPERM/EINVAL.
    // But let's try to let it proceed.
}

clean();
