const GENESIS_CONTRACT_ADDRESS = '0x6427f3C265E47BABCde870bcC4F71d1c4A12779b';
const BSC_RPC_URL = 'https://bsc-dataseed1.binance.org:443';

// Helper to validate Ethereum address
function isValidAddress(address) {
  if (typeof address !== 'string') return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Helper to normalize address
function normalizeAddress(address) {
  return '0x' + address.slice(2).toLowerCase();
}

// Main verification function using JSON-RPC calls
async function verifyGenesisMint(walletAddress) {
  try {
    // Validate address format
    if (!isValidAddress(walletAddress)) {
      return {
        verified: false,
        walletAddress,
        error: 'Invalid wallet address format',
        balance: '0',
      };
    }

    // Normalize the address
    const normalizedAddress = normalizeAddress(walletAddress);

    // Create JSON-RPC payload for eth_call to balanceOf
    // balanceOf(address) selector is 0x70a08231
    const functionSelector = '0x70a08231';
    const paddedAddress = normalizedAddress.slice(2).padStart(64, '0');
    const data = functionSelector + paddedAddress;

    // Make JSON-RPC call to BSC
    const response = await fetch(BSC_RPC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: GENESIS_CONTRACT_ADDRESS,
            data: data,
          },
          'latest',
        ],
        id: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const result = await response.json();

    if (result.error) {
      throw new Error(`RPC Error: ${result.error.message}`);
    }

    // Parse the result
    const balanceHex = result.result || '0x0';
    const balance = BigInt(balanceHex);
    const balanceString = balance.toString();
    const verified = balance > 0n;

    return {
      verified,
      walletAddress: normalizedAddress,
      balance: balanceString,
      message: verified
        ? `User owns ${balanceString} Genesis NFT${balance > 1n ? 's' : ''}`
        : 'User does not own any Genesis NFTs',
      contractAddress: GENESIS_CONTRACT_ADDRESS,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error verifying Genesis mint:', error);
    return {
      verified: false,
      walletAddress,
      error: error.message || 'Failed to verify Genesis mint',
      balance: '0',
      timestamp: new Date().toISOString(),
    };
  }
}

// Vercel Serverless Function Handler
export default async function handler(req, res) {
  console.log('API called:', { method: req.method, query: req.query, body: req.body });
  
  // Set CORS headers for cross-origin requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight CORS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    let walletAddress;

    // Support both GET and POST methods
    if (req.method === 'GET') {
      walletAddress = req.query.walletAddress;
    } else if (req.method === 'POST') {
      walletAddress = req.body?.walletAddress;
    } else {
      return res.status(405).json({
        verified: false,
        error: 'Method not allowed. Use GET or POST.',
      });
    }

    // Validate that wallet address was provided
    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        verified: false,
        error: 'Missing or invalid walletAddress parameter',
      });
    }

    console.log('Processing wallet:', walletAddress);
    
    // Perform verification
    const result = await verifyGenesisMint(walletAddress);
    
    console.log('Verification result:', result);

    // Return 200 even if verification fails (it's a valid API response)
    return res.status(200).json(result);
  } catch (error) {
    console.error('API Error:', error);
    console.error('Error stack:', error.stack);
    return res.status(500).json({
      verified: false,
      error: 'Internal server error',
      message: error.message,
      stack: error.stack,
    });
  }
}
