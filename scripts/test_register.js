const axios = require('axios');

const API_URL = 'http://localhost:5000/api/auth/register';

async function testRegister() {
    try {
        const testUser = {
            name: 'Test Client',
            email: `testclient_${Date.now()}@example.com`,
            password: 'password123',
            role: 'client',
            phone: '1234567890'
        };

        console.log('Registering user:', testUser.email);
        const response = await axios.post(API_URL, testUser);
        console.log('Registration Success:', response.data);
    } catch (error) {
        console.error('Registration Failed:', error.response ? error.response.data : error.message);
    }
}

testRegister();
