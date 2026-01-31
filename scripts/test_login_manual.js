const users = [
    { email: 'chrysler@gmail.com', password: '12345678', role: 'admin', desc: 'Valid Admin' },
    { email: 'sarah@conversaiq.com', password: 'agent123', role: 'agent', desc: 'Valid Agent' },
    { email: 'client@conversaiq.com', password: 'client123', role: 'client', desc: 'Valid Client' },
    { email: 'chrysler@gmail.com', password: 'wrongpassword', role: 'admin', desc: 'Wrong Password' },
    { email: 'chrysler@gmail.com', password: '12345678', role: 'agent', desc: 'Wrong Role (Admin as Agent)' },
    { email: 'bademail', password: '123', role: 'admin', desc: 'Invalid Email' }
];

async function testLogin(user) {
    try {
        console.log(`Testing [${user.desc}]...`);
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: user.email,
                password: user.password,
                role: user.role
            })
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = { error: 'Non-JSON response', body: text };
        }

        console.log(`  > User: ${user.email} (Role: ${user.role})`);
        console.log(`  > Status: ${response.status}`);
        console.log(`  > Result: ${response.ok ? 'SUCCESS' : `FAILED: ${data.error || data.body}`}`);
        console.log('---');
    } catch (error) {
        console.error(`  > Request Failed: ${error.message}`);
        console.log('---');
    }
}

async function run() {
    console.log('=== STARTING LOGIN TESTS ===\n');
    for (const user of users) {
        await testLogin(user);
    }
    console.log('=== TESTS COMPLETED ===');
}

run();
