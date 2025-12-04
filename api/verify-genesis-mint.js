const GENESIS_CONTRACT_ADDRESS = '0x6427f3C265E47BABCde870bcC4F71d1c4A12779b';
const BSC_RPC_URL = 'https://bsc-dataseed1.binance.org:443';

function isValidAddress(address) {
  if (typeof address !== 'string') return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function normalizeAddress(address) {
  return '0x' + address.slice(2).toLowerCase();
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
    const balance = BigInt(balanceHex);
    const verified = balance > 0n;

    return {
      verified,
      walletAddress: normalizedAddress,
      balance: balance.toString(),
      message: verified
        ? `User owns ${balance.toString()} Genesis NFT${balance > 1n ? 's' : ''}`
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

module.exports = async function handler(req, res) {
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
      walletAddress = req.query.walletAddress;
    } else if (req.method === 'POST') {
      walletAddress = req.body?.walletAddress;
    } else {
      return res.status(405).json({
        verified: false,
        error: 'Method not allowed. Use GET or POST.',
      });
    }

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        verified: false,
        error: 'Missing or invalid walletAddress parameter',
      });
    }

    const result = await verifyGenesisMint(walletAddress);
    return res.status(200).json(result);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      verified: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
};
