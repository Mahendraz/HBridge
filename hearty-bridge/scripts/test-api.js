const https = require('http');

async function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonResponse
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        status: 0,
        error: err.message,
        data: null
      });
    });

    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testTherapistAPI() {
  console.log('🧪 Testing Therapist API...\n');
  
  // Test 1: Try to access therapists without authentication
  console.log('1️⃣ Testing API without authentication...');
  const unauthResponse = await makeRequest('GET', '/api/therapists');
  console.log(`Status: ${unauthResponse.status}`);
  console.log('Response:', JSON.stringify(unauthResponse.data, null, 2));
  console.log('');

  // Test 2: Create admin login and get token
  console.log('2️⃣ Testing admin login...');
  const loginData = {
    email: 'admin@heartybridge.com',
    password: 'admin123'
  };
  
  const loginResponse = await makeRequest('POST', '/api/auth/login', loginData);
  console.log(`Login Status: ${loginResponse.status}`);
  console.log('Login Response:', JSON.stringify(loginResponse.data, null, 2));
  console.log('');

  if (loginResponse.data && loginResponse.data.token) {
    const token = loginResponse.data.token;
    
    // Test 3: Access therapists with admin token
    console.log('3️⃣ Testing therapists API with admin token...');
    const authHeaders = {
      'Authorization': `Bearer ${token}`
    };
    
    const therapistResponse = await makeRequest('GET', '/api/therapists', null, authHeaders);
    console.log(`Therapist API Status: ${therapistResponse.status}`);
    
    if (therapistResponse.data && therapistResponse.data.therapists) {
      console.log(`✅ Found ${therapistResponse.data.therapists.length} therapists!`);
      console.log('📊 Statistics:');
      console.log(`   - Total: ${therapistResponse.data.total}`);
      console.log(`   - Active: ${therapistResponse.data.active}`);
      console.log(`   - Avg Caseload: ${therapistResponse.data.avgCaseload}`);
      console.log(`   - Avg Rating: ${therapistResponse.data.avgRating}`);
      console.log('');
      console.log('👥 Therapists:');
      therapistResponse.data.therapists.forEach((therapist, index) => {
        console.log(`${index + 1}. ${therapist.name}`);
        console.log(`   Email: ${therapist.email}`);
        console.log(`   Specializations: ${therapist.specializations?.join(', ')}`);
        console.log(`   Patients: ${therapist.assignedPatients}/${therapist.maxPatients}`);
        console.log(`   Rating: ${therapist.rating}`);
        console.log('');
      });
    } else {
      console.log('❌ No therapists data found');
      console.log('Response:', JSON.stringify(therapistResponse.data, null, 2));
    }
  } else {
    console.log('❌ Login failed - cannot test authenticated APIs');
  }
  
  console.log('✅ API testing completed!');
}

// Check if server is running
console.log('🚀 Starting API Tests...');
console.log('Make sure the development server is running on localhost:3000');
console.log('You can start it with: npm run dev\n');

setTimeout(testTherapistAPI, 1000);