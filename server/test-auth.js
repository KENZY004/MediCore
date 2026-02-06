const fs = require('fs');
const path = require('path');

// Test data
const testData = {
    register: {
        name: "Test Admin",
        email: "admin@medicore.com",
        password: "admin123",
        role: "admin"
    },
    login: {
        email: "admin@medicore.com",
        password: "admin123"
    }
};

// Test register endpoint
async function testRegister() {
    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData.register)
        });

        const data = await response.json();
        console.log('✅ REGISTER TEST:');
        console.log(JSON.stringify(data, null, 2));
        return data;
    } catch (error) {
        console.error('❌ Register test failed:', error.message);
    }
}

// Test login endpoint
async function testLogin() {
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData.login)
        });

        const data = await response.json();
        console.log('\n✅ LOGIN TEST:');
        console.log(JSON.stringify(data, null, 2));
        return data;
    } catch (error) {
        console.error('❌ Login test failed:', error.message);
    }
}

// Test protected route
async function testProtectedRoute(token) {
    try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        console.log('\n✅ PROTECTED ROUTE TEST:');
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('❌ Protected route test failed:', error.message);
    }
}

// Run all tests
async function runTests() {
    console.log('🧪 Starting Authentication Tests...\n');

    const registerResult = await testRegister();

    if (registerResult && registerResult.success) {
        const loginResult = await testLogin();

        if (loginResult && loginResult.success && loginResult.data.token) {
            await testProtectedRoute(loginResult.data.token);
        }
    }

    console.log('\n✅ All tests completed!');
}

runTests();
