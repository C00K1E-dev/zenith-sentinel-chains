/**
 * Blockchain Explorer API Service
 * Fetches verified smart contract source code from blockchain explorers using Etherscan V2 API
 * Updated: December 2025 - Unified V2 API endpoint for all chains
 */

// Single API Key for Etherscan V2 (works for all chains)
const ETHERSCAN_API_KEY = 'V8WAAJQ6JU31R5YMNSM7XCEUVGIASRN7T7';

// Unified Etherscan V2 API endpoint
const ETHERSCAN_V2_API = 'https://api.etherscan.io/v2/api';

// Chain ID to explorer web URL mapping
const CHAIN_WEB_URLS: Record<string, string> = {
  '1': 'https://etherscan.io',
  '56': 'https://bscscan.com',
  '137': 'https://polygonscan.com',
  '42161': 'https://arbiscan.io',
  '42170': 'https://nova.arbiscan.io',
  '10': 'https://optimistic.etherscan.io',
  '8453': 'https://basescan.org',
  '43114': 'https://snowtrace.io',
  '100': 'https://gnosisscan.io',
  '324': 'https://explorer.zksync.io',
  '59144': 'https://lineascan.build',
  '5000': 'https://explorer.mantle.xyz',
  '534352': 'https://scrollscan.com',
  '81457': 'https://blastscan.io',
  '42220': 'https://celoscan.io',
  '1284': 'https://moonscan.io',
  '1285': 'https://moonriver.moonscan.io',
  '199': 'https://bttcscan.com',
  '204': 'https://opbnbscan.com',
  '11155111': 'https://sepolia.etherscan.io',
  '17000': 'https://holesky.etherscan.io',
  '421614': 'https://sepolia.arbiscan.io',
  '80002': 'https://amoy.polygonscan.com',
  '300': 'https://sepolia.explorer.zksync.io',
};

export interface ContractSourceCode {
  contractName: string;
  sourceCode: string;
  abi: string;
  compilerVersion: string;
  optimization: boolean;
  runs: number;
  constructorArguments: string;
  evmVersion: string;
  library: string;
  licenseType: string;
  proxy: boolean;
  implementation?: string;
  swarmSource?: string;
}

export interface EtherscanResponse {
  status: string;
  message: string;
  result: any;
}

/**
 * Validate if an address is a valid Ethereum/EVM address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Get blockchain explorer URL for a contract address
 */
export function getExplorerUrl(address: string, chainId: string): string {
  const baseUrl = CHAIN_WEB_URLS[chainId] || 'https://etherscan.io';
  return `${baseUrl}/address/${address}#code`;
}

/**
 * Fetch verified contract source code from Etherscan V2 API
 * Works for all supported chains using unified endpoint
 */
export async function fetchContractSourceCode(
  contractAddress: string,
  chainId: string
): Promise<ContractSourceCode> {
  if (!isValidAddress(contractAddress)) {
    throw new Error('Invalid contract address format. Must be a valid 0x address.');
  }

  // Build V2 API URL with chainid parameter
  const url = `${ETHERSCAN_V2_API}?chainid=${chainId}&module=contract&action=getsourcecode&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`;

  const chainName = CHAIN_WEB_URLS[chainId] ? `Chain ${chainId}` : 'Unknown Chain';

  console.log(`🔍 Fetching contract from ${chainName}:`, {
    chainId,
    address: contractAddress,
    apiUrl: ETHERSCAN_V2_API,
    fullUrl: url,
    hasApiKey: !!ETHERSCAN_API_KEY,
    explorerUrl: getExplorerUrl(contractAddress, chainId)
  });

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data: EtherscanResponse = await response.json();

    console.log(`📡 Chain ${chainId} API Response:`, {
      status: data.status,
      message: data.message,
      result: data.result,
      hasResult: !!data.result,
      resultLength: Array.isArray(data.result) ? data.result.length : 0,
      resultIsArray: Array.isArray(data.result)
    });

    // Check if we got a valid response
    if (data.status !== '1') {
      // Log full response for debugging
      console.error('❌ API Error Response:', data);
      
      const message = data.message || '';
      const explorerUrl = getExplorerUrl(contractAddress, chainId);
      
      if (message.toLowerCase().includes('invalid api key') || message.toLowerCase().includes('api key')) {
        throw new Error(
          `Invalid or missing API key for Chain ${chainId}.\n\n` +
          `Try without API key (limited to 5 calls/second) or get a key from:\n` +
          `https://etherscan.io/myapikey`
        );
      } else if (message.toLowerCase().includes('rate limit')) {
        throw new Error(
          `API rate limit reached for Chain ${chainId}.\n` +
          `Please wait a few seconds and try again.\n\n` +
          `To remove limits, get an API key from:\n` +
          `https://etherscan.io/myapikey`
        );
      } else if (data.result && typeof data.result === 'string' && data.result.includes('Max rate limit')) {
        throw new Error(
          `Rate limit exceeded for Chain ${chainId}.\n` +
          `Free tier: 5 calls/second\n` +
          `Please wait 10 seconds and try again.`
        );
      } else {
        throw new Error(
          `API Error from Chain ${chainId}: ${message || 'Unknown error'}\n\n` +
          `Please verify:\n` +
          `• Contract address is correct: ${contractAddress}\n` +
          `• Contract is deployed on Chain ${chainId}\n` +
          `• Check manually at: ${explorerUrl}`
        );
      }
    }

    // Check if result exists and is an array
    if (!data.result || !Array.isArray(data.result) || data.result.length === 0) {
      const explorerUrl = getExplorerUrl(contractAddress, chainId);
      throw new Error(
        `No contract data returned from Chain ${chainId}.\n\n` +
        `This usually means:\n` +
        `• Contract doesn't exist at: ${contractAddress}\n` +
        `• Wrong blockchain selected (you selected Chain ${chainId})\n` +
        `• Contract not deployed yet\n\n` +
        `Verify at: ${explorerUrl}`
      );
    }

    const result = data.result[0];

    // Check if result object exists
    if (!result || typeof result !== 'object') {
      const explorerUrl = getExplorerUrl(contractAddress, chainId);
      throw new Error(
        `Invalid response format from Chain ${chainId}.\n` +
        `Contract: ${contractAddress}\n` +
        `Check at: ${explorerUrl}`
      );
    }

    // Check if contract is verified
    if (!result.SourceCode || result.SourceCode === '') {
      const explorerUrl = getExplorerUrl(contractAddress, chainId);
      throw new Error(
        `❌ Contract is NOT VERIFIED on Chain ${chainId}\n\n` +
        `Contract: ${contractAddress}\n\n` +
        `To use this feature, you must verify your contract first:\n` +
        `1. Go to: ${explorerUrl.replace('#code', '#verifyContract')}\n` +
        `2. Submit your contract source code\n` +
        `3. Wait for verification (usually instant)\n\n` +
        `OR use the Upload/Paste method instead (works with unverified contracts)`
      );
    }

    // Parse source code (handle both single file and multi-file JSON formats)
    let sourceCode = result.SourceCode;
    let contractName = result.ContractName;

    // Check if it's a multi-file JSON format (starts with {{ or {)
    if (sourceCode.startsWith('{{') || (sourceCode.startsWith('{') && sourceCode.includes('sources'))) {
      try {
        // Remove outer braces if present
        const cleanJson = sourceCode.startsWith('{{') 
          ? sourceCode.slice(1, -1) 
          : sourceCode;
        
        const parsed = JSON.parse(cleanJson);
        
        // Extract all source files
        if (parsed.sources) {
          const files = Object.entries(parsed.sources).map(([filename, content]: [string, any]) => {
            return `// File: ${filename}\n${content.content || content}`;
          });
          sourceCode = files.join('\n\n');
        } else {
          // Fallback: just use the main contract file
          sourceCode = Object.values(parsed)[0] as string;
        }
      } catch (e) {
        // If JSON parsing fails, use as-is
        console.warn('Failed to parse multi-file contract format:', e);
      }
    }

    const contractInfo: ContractSourceCode = {
      contractName,
      sourceCode,
      abi: result.ABI,
      compilerVersion: result.CompilerVersion,
      optimization: result.OptimizationUsed === '1',
      runs: parseInt(result.Runs) || 200,
      constructorArguments: result.ConstructorArguments || '',
      evmVersion: result.EVMVersion || 'default',
      library: result.Library || '',
      licenseType: result.LicenseType || 'None',
      proxy: result.Proxy === '1',
      implementation: result.Implementation || undefined,
      swarmSource: result.SwarmSource || undefined,
    };

    return contractInfo;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to fetch contract source code. Please check the address and try again.');
  }
}

