import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Genesis ABI
const abiPath = path.join(__dirname, '../src/contracts/SmartSentinelsGenesis.json');
const GENESIS_ABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

const GENESIS_CONTRACT_ADDRESS = '0x6427f3C265E47BABCde870bcC4F71d1c4A12779b';
const BSC_RPC_URL = 'https://bsc-dataseed1.binance.org:443';

// Helper to validate Ethereum address
function isValidAddress(address) {
  return ethers.isAddress(address);
}

// Helper to normalize address
function normalizeAddress(address) {
  return ethers.getAddress(address);
}

// Main verification function
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

    // Create provider connected to BSC RPC
    const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);

    // Create contract instance (read-only, no signer needed)
    const genesisContract = new ethers.Contract(
      GENESIS_CONTRACT_ADDRESS,
      GENESIS_ABI,
      provider
    );

    // Query balanceOf to check if wallet owns any Genesis NFTs
    const balance = await genesisContract.balanceOf(normalizedAddress);

    // Convert to string for cleaner response
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

    // Perform verification
    const result = await verifyGenesisMint(walletAddress);

    // Return 200 even if verification fails (it's a valid API response)
    return res.status(200).json(result);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      verified: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}
