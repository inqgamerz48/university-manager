// Native fetch is available in Node 18+

async function runIntegrationTests() {
    const BASE_URL = 'http://localhost:3000';
    console.log(`Starting Integration Tests against ${BASE_URL}...`);

    try {
        // 1. Health Check (Simulated by checking login page load)
        console.log('1. Checking Server Connectivity...');
        const healthRes = await fetch(`${BASE_URL}/login`);
        if (healthRes.status === 200) {
            console.log('✅ Server is reachable (Login page loaded)');
        } else {
            console.error(`❌ Server returned status ${healthRes.status}`);
        }

        // 2. Check Auth Endpoint (Should return 405 for GET or 400 for bad headers)
        console.log('2. Checking Auth API...');
        const authRes = await fetch(`${BASE_URL}/api/auth/callback`);
        console.log(`ℹ️ Auth Callback Status: ${authRes.status} (Expected 404 or 405 or 307 depending on impl)`);

        // 3. Admin Stats (Unauthenticated -> Should contain "Unauthorized" or redirect)
        console.log('3. Checking Admin Stats Protection...');
        const statsRes = await fetch(`${BASE_URL}/api/admin/stats`);
        if (statsRes.status === 401 || statsRes.status === 307 || statsRes.url.includes('login')) {
            console.log('✅ Admin Stats correctly protected (Unauthorized/Redirected)');
        } else {
            console.warn(`⚠️ Admin Stats returned ${statsRes.status}. Check middleware protection.`);
        }

        console.log('\n--- Test Summary ---');
        console.log('Basic integration checks completed.');
        console.log('To run full tests, ensure the server is running with "npm run dev".');

    } catch (error) {
        console.error('❌ Integration Test Failed:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('Hint: Is the server running? Run "npm run dev" in another terminal.');
        }
    }
}

runIntegrationTests();
