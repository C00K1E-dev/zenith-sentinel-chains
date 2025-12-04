const GENESIS_CONTRACT_ADDRESS = '0x6427f3C265E47BABCde870bcC4F71d1c4A12779b';
const BSC_RPC_URL = 'https://bsc-dataseed1.binance.org:443';

function isValidAddress(address) {
  if (typeof address !== 'string') return false;
  // Accept both full addresses (42 chars) and addresses missing checksum
  const trimmed = address.trim();
  return /^0x[a-fA-F0-9]{40,42}$/.test(trimmed);
}

function normalizeAddress(address) {
  const trimmed = address.trim();
  // Ensure it starts with 0x and normalize to lowercase
  const cleaned = trimmed.startsWith('0x') ? trimmed : '0x' + trimmed;
  return cleaned.toLowerCase();
}

async function verifyGenesisMint(walletAddress) {
  if (!isValidAddress(walletAddress)) {
    return {
      verified: false,
      walletAddress,
      error: 'Invalid wallet address format',
      balance: '0',
    };
  }

  const normalizedAddress = normalizeAddress(walletAddress);
  const functionSelector = '0x70a08231';
  const paddedAddress = normalizedAddress.slice(2).padStart(64, '0');
  const data = functionSelector + paddedAddress;

  try {
    const response = await fetch(BSC_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    const result = await response.json();

    if (result.error) {
      throw new Error(result.error.message);
    }

    const balanceHex = result.result || '0x0';
    // Parse hex to number string without BigInt
    const balanceNum = parseInt(balanceHex, 16);
    const verified = balanceNum > 0;

    return {
      verified,
      walletAddress: normalizedAddress,
      balance: balanceNum.toString(),
      message: verified
        ? `User owns ${balanceNum} Genesis NFT${balanceNum > 1 ? 's' : ''}`
        : 'User does not own any Genesis NFTs',
      contractAddress: GENESIS_CONTRACT_ADDRESS,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      verified: false,
      walletAddress,
      error: error.message || 'Failed to verify Genesis mint',
      balance: '0',
      timestamp: new Date().toISOString(),
    };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let walletAddress;

    if (req.method === 'GET') {
      walletAddress = req.query.walletAddress || req.query.wallet || req.query.address;
    } else if (req.method === 'POST') {
      walletAddress = req.body?.walletAddress || req.body?.wallet || req.body?.address;
    } else {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed. Use GET or POST.',
        data: null
      });
    }

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid walletAddress parameter',
        data: null
      });
    }

    const result = await verifyGenesisMint(walletAddress);
    
    // Return Micro3-compatible format
    return res.status(200).json({
      success: true,
      data: {
        verified: result.verified,
        eligible: result.verified,
        walletAddress: result.walletAddress,
        nftBalance: result.balance,
        details: {
          contractAddress: result.contractAddress,
          message: result.message,
          timestamp: result.timestamp,
          network: 'BSC',
          chainId: 56
        }
      }
    });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      data: null
    });
  }
}
