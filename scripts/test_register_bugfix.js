async function testRegister() {
    try {
        const user = {
            name: 'Bugfix Test User',
            email: `bugfix_${Date.now()}_${Math.floor(Math.random() * 10000)}@example.com`,
            password: 'password123',
            role: 'client',
            phone: '' // Testing empty phone
        };

        console.log(`Registering user with empty phone: ${user.email}`);
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });

        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = { error: 'Non-JSON response', body: text };
        }

        console.log(`Status: ${response.status}`);
        if (response.ok) {
            console.log('SUCCESS: Generated User ID:', data.data.user._id);
            console.log('User Phone in DB:', data.data.user.phone);
        } else {
            console.log('FAILED:', data.error || data.body);
        }

    } catch (error) {
        console.error('Request Failed:', error.message);
    }
}

testRegister();
