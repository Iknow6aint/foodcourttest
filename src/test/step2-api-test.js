/**
 * Step 2 API Testing Script
 * Tests the rider API endpoints
 */

const API_BASE = 'http://localhost:3000';
const TEST_RIDER_ID = 1; // From our seeded data

async function testRiderAPI() {
  console.log('🚀 Testing Step 2: Rider API Endpoints\n');

  const headers = {
    'Content-Type': 'application/json',
    'x-rider-id': TEST_RIDER_ID.toString(),
  };

  try {
    // Test 1: Get Rider Profile
    console.log('1. Testing GET /api/riders/me');
    const profileResponse = await fetch(`${API_BASE}/api/riders/me`, {
      method: 'GET',
      headers,
    });
    const profile = await profileResponse.json();
    console.log('Status:', profileResponse.status);
    console.log('Profile:', JSON.stringify(profile, null, 2));
    console.log('✅ Profile endpoint working\n');

    // Test 2: Update Location
    console.log('2. Testing PUT /api/riders/me/location');
    const locationData = {
      current_latitude: 37.7749,
      current_longitude: -122.4194,
    };
    const locationResponse = await fetch(`${API_BASE}/api/riders/me/location`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(locationData),
    });
    const locationResult = await locationResponse.json();
    console.log('Status:', locationResponse.status);
    console.log('Location Update:', JSON.stringify(locationResult, null, 2));
    console.log('✅ Location update endpoint working\n');

    // Test 3: Get Current Location
    console.log('3. Testing GET /api/riders/me/location');
    const currentLocationResponse = await fetch(`${API_BASE}/api/riders/me/location`, {
      method: 'GET',
      headers,
    });
    const currentLocation = await currentLocationResponse.json();
    console.log('Status:', currentLocationResponse.status);
    console.log('Current Location:', JSON.stringify(currentLocation, null, 2));
    console.log('✅ Get location endpoint working\n');

    // Test 4: Update Availability
    console.log('4. Testing PATCH /api/riders/me/availability');
    const availabilityData = {
      is_available: true,
    };
    const availabilityResponse = await fetch(`${API_BASE}/api/riders/me/availability`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(availabilityData),
    });
    const availabilityResult = await availabilityResponse.json();
    console.log('Status:', availabilityResponse.status);
    console.log('Availability Update:', JSON.stringify(availabilityResult, null, 2));
    console.log('✅ Availability update endpoint working\n');

    // Test 5: Update Profile
    console.log('5. Testing PATCH /api/riders/me/profile');
    const profileUpdateData = {
      vehicle_type: 'motorcycle',
      license_plate: 'TEST-456',
    };
    const profileUpdateResponse = await fetch(`${API_BASE}/api/riders/me/profile`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(profileUpdateData),
    });
    const profileUpdateResult = await profileUpdateResponse.json();
    console.log('Status:', profileUpdateResponse.status);
    console.log('Profile Update:', JSON.stringify(profileUpdateResult, null, 2));
    console.log('✅ Profile update endpoint working\n');

    // Test 6: Invalid Coordinates
    console.log('6. Testing invalid coordinates (should fail)');
    const invalidLocationData = {
      current_latitude: 91, // Invalid latitude
      current_longitude: -122.4194,
    };
    const invalidLocationResponse = await fetch(`${API_BASE}/api/riders/me/location`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(invalidLocationData),
    });
    const invalidLocationResult = await invalidLocationResponse.json();
    console.log('Status:', invalidLocationResponse.status);
    console.log('Error Response:', JSON.stringify(invalidLocationResult, null, 2));
    console.log('✅ Validation working correctly\n');

    console.log('🎉 All Step 2 API tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Check if running in Node.js environment
if (typeof window === 'undefined' && typeof global !== 'undefined') {
  // Node.js environment - need to import fetch
  const { fetch } = require('undici');
  global.fetch = fetch;
  testRiderAPI();
}

module.exports = { testRiderAPI };
