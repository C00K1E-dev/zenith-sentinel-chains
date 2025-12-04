/**
 * Test script for verify-genesis-mint API
 * Tests various scenarios to ensure Micro3 compatibility
 */

const API_URL = 'http://localhost:3000/api/verify-genesis-mint';

// Test wallet addresses
const TEST_CASES = [
  {
    name: 'Valid wallet with Genesis NFT',
    wallet: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // Replace with actual wallet that owns NFT
    expectedVerified: true
  },
  {
    name: 'Valid wallet without Genesis NFT',
    wallet: '0x0000000000000000000000000000000000000001',
    expectedVerified: false
  },
  {
    name: 'Invalid wallet address format',
    wallet: 'invalid-address',
    expectedVerified: false,
    expectedError: true
  },
  {
    name: 'Empty wallet address',
    wallet: '',
    expectedVerified: false,
    expectedError: true
  },
  {
    name: 'Null wallet address',
    wallet: null,
    expectedVerified: false,
    expectedError: true
  }
];

async function testAPI(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`);
  console.log(`   Wallet: ${testCase.wallet}`);
  
  try {
    // Test GET method
    console.log('   → Testing GET method...');
    const getUrl = `${API_URL}?walletAddress=${encodeURIComponent(testCase.wallet || '')}`;
    const getResponse = await fetch(getUrl);
    const getData = await getResponse.json();
    
    console.log(`   ✓ GET Status: ${getResponse.status}`);
    console.log(`   ✓ Response:`, JSON.stringify(getData, null, 2));
    
    // Validate response structure
    validateResponse(getData, testCase);
    
    // Test POST method
    console.log('   → Testing POST method...');
    const postResponse = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress: testCase.wallet })
    });
    const postData = await postResponse.json();
    
    console.log(`   ✓ POST Status: ${postResponse.status}`);
    console.log(`   ✓ Response:`, JSON.stringify(postData, null, 2));
    
    // Validate response structure
    validateResponse(postData, testCase);
    
    console.log(`   ✅ Test passed: ${testCase.name}`);
    return true;
  } catch (error) {
    console.error(`   ❌ Test failed: ${testCase.name}`);
    console.error(`   Error:`, error.message);
    return false;
  }
}

function validateResponse(data, testCase) {
  // Check Micro3-compatible structure
  if (!data.hasOwnProperty('success')) {
    throw new Error('Response missing "success" field');
  }
  
  if (testCase.expectedError) {
    if (data.success !== false) {
      throw new Error('Expected success=false for error case');
    }
    if (!data.error) {
      throw new Error('Expected error message for error case');
    }
  } else {
    if (!data.hasOwnProperty('data')) {
      throw new Error('Response missing "data" field');
    }
    
    if (data.success && data.data) {
      if (!data.data.hasOwnProperty('verified')) {
        throw new Error('Response data missing "verified" field');
      }
      if (!data.data.hasOwnProperty('eligible')) {
        throw new Error('Response data missing "eligible" field');
      }
      if (!data.data.hasOwnProperty('walletAddress')) {
        throw new Error('Response data missing "walletAddress" field');
      }
      if (!data.data.hasOwnProperty('details')) {
        throw new Error('Response data missing "details" field');
      }
      
      // Validate verified matches expected
      if (testCase.expectedVerified !== undefined) {
        if (data.data.verified !== testCase.expectedVerified) {
          console.warn(`   ⚠️  Warning: Expected verified=${testCase.expectedVerified}, got ${data.data.verified}`);
        }
      }
    }
  }
}

async function testProductionAPI(wallet) {
  console.log('\n🌐 Testing PRODUCTION API');
  console.log(`   URL: https://smartsentinels.net/api/verify-genesis-mint`);
  console.log(`   Wallet: ${wallet}`);
  
  try {
    const url = `https://smartsentinels.net/api/verify-genesis-mint?walletAddress=${encodeURIComponent(wallet)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log(`   ✅ Production API is working!`);
      console.log(`   Verified: ${data.data.verified}`);
      console.log(`   NFT Balance: ${data.data.nftBalance}`);
    } else {
      console.log(`   ⚠️  API returned unexpected format`);
    }
    
    return data;
  } catch (error) {
    console.error(`   ❌ Production API test failed:`, error.message);
    return null;
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 SmartSentinels Genesis NFT Verification API Tests');
  console.log('═══════════════════════════════════════════════════════');
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of TEST_CASES) {
    const result = await testAPI(testCase);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 Test Summary');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📝 Total:  ${TEST_CASES.length}`);
  
  // Test production if available
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🌍 Testing Production Deployment');
  console.log('═══════════════════════════════════════════════════════');
  
  // Use a wallet that should have NFTs (adjust as needed)
  await testProductionAPI('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✨ Tests Complete!');
  console.log('═══════════════════════════════════════════════════════\n');
}

// Run tests
runAllTests().catch(console.error);
