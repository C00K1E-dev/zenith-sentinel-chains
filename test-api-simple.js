/**
 * Simple test script for Genesis NFT Verification API
 * Run with: node test-api-simple.js
 */

// Test configurations
const PRODUCTION_URL = 'https://smartsentinels.net/api/verify-genesis-mint';
const LOCALHOST_URL = 'http://localhost:3000/api/verify-genesis-mint';

// Test wallet addresses
const TEST_WALLETS = {
  // Add your known wallet addresses here
  withNFT: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // Replace with actual wallet
  withoutNFT: '0x0000000000000000000000000000000000000001',
  invalid: 'invalid-address',
  empty: ''
};

async function testEndpoint(url, walletAddress, testName) {
  console.log(`\n🧪 Test: ${testName}`);
  console.log(`   URL: ${url}`);
  console.log(`   Wallet: ${walletAddress || '(empty)'}`);
  
  try {
    // Test GET request
    const getUrl = `${url}?walletAddress=${encodeURIComponent(walletAddress)}`;
    const response = await fetch(getUrl);
    const data = await response.json();
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response:`, JSON.stringify(data, null, 2));
    
    // Validate structure
    if (data.success !== undefined) {
      console.log(`   ✅ Has 'success' field: ${data.success}`);
    } else {
      console.log(`   ⚠️  Missing 'success' field`);
    }
    
    if (data.data) {
      console.log(`   ✅ Has 'data' field`);
      if (data.data.verified !== undefined) {
        console.log(`   ✅ Verified: ${data.data.verified}`);
      }
      if (data.data.eligible !== undefined) {
        console.log(`   ✅ Eligible: ${data.data.eligible}`);
      }
      if (data.data.nftBalance !== undefined) {
        console.log(`   ✅ NFT Balance: ${data.data.nftBalance}`);
      }
    } else if (data.error) {
      console.log(`   ⚠️  Error: ${data.error}`);
    }
    
    return { success: true, data };
  } catch (error) {
    console.error(`   ❌ Test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🚀 SmartSentinels Genesis NFT Verification API Test');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`   Date: ${new Date().toISOString()}`);
  
  // Test Production API
  console.log('\n\n🌐 PRODUCTION API TESTS');
  console.log('───────────────────────────────────────────────────────');
  
  await testEndpoint(PRODUCTION_URL, TEST_WALLETS.withNFT, 'Wallet with NFT (Production)');
  await testEndpoint(PRODUCTION_URL, TEST_WALLETS.withoutNFT, 'Wallet without NFT (Production)');
  await testEndpoint(PRODUCTION_URL, TEST_WALLETS.invalid, 'Invalid Wallet (Production)');
  
  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('✨ Tests Complete!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n📋 For Micro3 Integration:');
  console.log('   API Endpoint: ' + PRODUCTION_URL);
  console.log('   Method: GET or POST');
  console.log('   Parameter: walletAddress (string)');
  console.log('   Response Format: { success: boolean, data: { verified: boolean, ... } }');
  console.log('\n');
}

// Run the tests
runTests().catch(console.error);
