import { useState, useEffect, useMemo } from 'react';
import { useActiveAccount, useReadContract } from 'thirdweb/react';
import { getContract, readContract } from 'thirdweb';
import { Loader } from 'lucide-react';
import { bsc, bscTestnet } from 'thirdweb/chains';
import { createThirdwebClient } from 'thirdweb';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  GENESIS_CONTRACT_ADDRESS,
  GENESIS_CHAIN_ID,
  GENESIS_ABI,
  AI_AUDIT_CONTRACT_ADDRESS,
  AI_AUDIT_CHAIN_ID,
  AI_AUDIT_ABI,
} from '@/contracts';
import { formatContractAddress, getTokenExplorerUrl } from '@/lib/utils';

const thirdwebClient = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

const SidebarMyNFTs = ({ onSendNFT }: { onSendNFT?: (tokenId: bigint, tokenName: string, imgSrc: string, contractAddress: string, chainId: number, abi: any) => void }) => {
  const account = useActiveAccount();
  const isMobile = useIsMobile();

  const address = account?.address;
  const isConnected = !!account;

  // Memoize contracts to prevent recreation on every render
  const genesisContract = useMemo(() => 
    getContract({ 
      client: thirdwebClient, 
      address: GENESIS_CONTRACT_ADDRESS, 
      chain: bsc 
    }), []);

  const aiAuditContract = useMemo(() => 
    getContract({ 
      client: thirdwebClient, 
      address: AI_AUDIT_CONTRACT_ADDRESS, 
      chain: bsc 
    }), []);

  // States for balances and token IDs
  const [genesisBalance, setGenesisBalance] = useState<bigint | null>(null);
  const [aiAuditBalance, setAiAuditBalance] = useState<bigint | null>(null);
  const [genesisBalanceLoading, setGenesisBalanceLoading] = useState(false);
  const [aiAuditBalanceLoading, setAiAuditBalanceLoading] = useState(false);
  const [genesisIds, setGenesisIds] = useState<bigint[]>([]);
  const [aiAuditIds, setAiAuditIds] = useState<bigint[]>([]);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  // Helper function to fetch token IDs with multiple fallback methods
  const fetchTokenIds = async (
    contract: any,
    ownerAddress: string,
    contractName: string
  ): Promise<bigint[]> => {
    console.log(`🔍 Fetching ${contractName} tokens for:`, ownerAddress);

    // Method 1: Try tokensOfOwner (ERC721Enumerable extension)
    try {
      const result = await readContract({
        contract,
        method: 'function tokensOfOwner(address owner) view returns (uint256[])',
        params: [ownerAddress],
      });
      console.log(`✅ ${contractName} tokensOfOwner succeeded:`, result);
      return result as bigint[];
    } catch (error) {
      console.log(`⚠️ ${contractName} tokensOfOwner failed:`, error);
    }

    // Method 2: Try balanceOf + tokenOfOwnerByIndex
    try {
      const balance = await readContract({
        contract,
        method: 'function balanceOf(address owner) view returns (uint256)',
        params: [ownerAddress],
      });
      console.log(`✅ ${contractName} balance:`, balance.toString());

      const balanceNum = Number(balance);
      if (balanceNum === 0) return [];

      const tokenIds: bigint[] = [];
      const fetchPromises = [];

      for (let i = 0; i < balanceNum; i++) {
        fetchPromises.push(
          readContract({
            contract,
            method: 'function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)',
            params: [ownerAddress, BigInt(i)],
          }).catch(err => {
            console.error(`❌ ${contractName} tokenOfOwnerByIndex[${i}] failed:`, err);
            return null;
          })
        );
      }

      const results = await Promise.all(fetchPromises);
      for (const result of results) {
        if (result !== null) {
          tokenIds.push(result as bigint);
        }
      }

      console.log(`✅ ${contractName} token IDs via balanceOf:`, tokenIds);
      return tokenIds;
    } catch (error) {
      console.error(`❌ ${contractName} balanceOf method failed:`, error);
    }

    // Method 3: Try walletOfOwner (alternative method name)
    try {
      const result = await readContract({
        contract,
        method: 'function walletOfOwner(address owner) view returns (uint256[])',
        params: [ownerAddress],
      });
      console.log(`✅ ${contractName} walletOfOwner succeeded:`, result);
      return result as bigint[];
    } catch (error) {
      console.log(`⚠️ ${contractName} walletOfOwner not available:`, error);
    }

    console.error(`❌ All methods failed for ${contractName}`);
    return [];
  };

  // Fetch Genesis NFTs
  useEffect(() => {
    let isMounted = true;

    const fetchGenesis = async () => {
      if (!address) {
        setGenesisIds([]);
        setGenesisBalance(null);
        return;
      }

      setGenesisBalanceLoading(true);
      setErrorMessages(prev => prev.filter(msg => !msg.includes('Genesis')));

      try {
        const ids = await fetchTokenIds(genesisContract, address, 'Genesis');
        
        if (isMounted) {
          setGenesisIds(ids);
          setGenesisBalance(BigInt(ids.length));
          console.log(`✅ Genesis NFTs loaded: ${ids.length} tokens`, ids.map(id => id.toString()));
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ Genesis fetch error:', error);
        if (isMounted) {
          setGenesisIds([]);
          setGenesisBalance(BigInt(0));
          setErrorMessages(prev => [...prev, `Genesis: ${errorMsg}`]);
        }
      } finally {
        if (isMounted) {
          setGenesisBalanceLoading(false);
        }
      }
    };

    fetchGenesis();

    return () => {
      isMounted = false;
    };
  }, [address, genesisContract]);

  // Fetch AI Audit NFTs
  useEffect(() => {
    let isMounted = true;

    const fetchAiAudit = async () => {
      if (!address) {
        setAiAuditIds([]);
        setAiAuditBalance(null);
        return;
      }

      setAiAuditBalanceLoading(true);
      setErrorMessages(prev => prev.filter(msg => !msg.includes('AI Audit')));

      try {
        const ids = await fetchTokenIds(aiAuditContract, address, 'AI Audit');
        
        if (isMounted) {
          setAiAuditIds(ids);
          setAiAuditBalance(BigInt(ids.length));
          console.log(`✅ AI Audit NFTs loaded: ${ids.length} tokens`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('❌ AI Audit fetch error:', error);
        if (isMounted) {
          setAiAuditIds([]);
          setAiAuditBalance(BigInt(0));
          setErrorMessages(prev => [...prev, `AI Audit: ${errorMsg}`]);
        }
      } finally {
        if (isMounted) {
          setAiAuditBalanceLoading(false);
        }
      }
    };

    fetchAiAudit();

    return () => {
      isMounted = false;
    };
  }, [address, aiAuditContract]);

  // Collection information
  const collections = useMemo(() => [
    {
      name: 'SmartSentinels Genesis',
      contractAddress: GENESIS_CONTRACT_ADDRESS,
      chainId: GENESIS_CHAIN_ID,
      abi: GENESIS_ABI,
      nfts: genesisIds
    },
    {
      name: 'SmartSentinels AI Audit',
      contractAddress: AI_AUDIT_CONTRACT_ADDRESS,
      chainId: AI_AUDIT_CHAIN_ID,
      abi: AI_AUDIT_ABI,
      nfts: aiAuditIds
    }
  ], [genesisIds, aiAuditIds]);

  const totalNFTs = genesisIds.length + aiAuditIds.length;
  const isLoading = genesisBalanceLoading || aiAuditBalanceLoading;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-orbitron font-bold mb-4 text-foreground">
        My NFTs {totalNFTs > 0 && `(${totalNFTs})`}
      </h2>
      
      <div className="nft-collections-container">
        {!isConnected && (
          <div className="hub-placeholder">
            <p>Connect your wallet to view NFTs</p>
          </div>
        )}

        {isConnected && isLoading && (
          <div className="hub-placeholder">
            <Loader className="animate-spin mx-auto mb-2" size={32} />
            <p>Loading NFTs...</p>
          </div>
        )}

        {isConnected && !isLoading && totalNFTs === 0 && (
          <div className="hub-placeholder">
            <p className="font-bold mb-2">No NFTs found in this wallet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Connected wallet: <code className="text-xs">{address}</code>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              If you own SmartSentinels NFTs, verify them on the blockchain:
            </p>
            <div className="mt-2 space-y-1">
              <a 
                href={`https://bscscan.com/token/${GENESIS_CONTRACT_ADDRESS}?a=${address}`} 
                target="_blank" 
                rel="noreferrer" 
                className="block text-blue-500 hover:text-blue-700 underline text-sm"
              >
                📋 Genesis on BSC Mainnet
              </a>
              <a 
                href={`https://bscscan.com/token/${AI_AUDIT_CONTRACT_ADDRESS}?a=${address}`} 
                target="_blank" 
                rel="noreferrer" 
                className="block text-blue-500 hover:text-blue-700 underline text-sm"
              >
                📋 AI Audit on BSC Mainnet
              </a>
            </div>
            {errorMessages.length > 0 && (
              <div className="mt-4 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-600 dark:text-red-400">
                <div className="font-bold">Contract Read Errors:</div>
                {errorMessages.map((msg, i) => <div key={i} className="mt-1">{msg}</div>)}
              </div>
            )}
          </div>
        )}

        {collections.map((collection) => (
          collection.nfts.length > 0 && (
            <div key={collection.contractAddress} className="nft-collection-group">
              <div className="collection-header">
                <div className="collection-info">
                  <h4 className="collection-name">{collection.name}</h4>
                  <p className="collection-address">
                    Contract: <code>{formatContractAddress(collection.contractAddress, isMobile)}</code>
                  </p>
                </div>
              </div>

              <div className="nft-grid">
                {collection.nfts.map((id) => (
                  <NFTCard 
                    key={`${collection.contractAddress}-${id.toString()}`} 
                    tokenId={id} 
                    contractAddress={collection.contractAddress} 
                    abi={collection.abi} 
                    chainId={collection.chainId} 
                    onSendNFT={onSendNFT} 
                  />
                ))}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

const NFTCard = ({ tokenId, contractAddress, abi, chainId, onSendNFT }: { 
  tokenId: bigint; 
  contractAddress: string; 
  abi: any; 
  chainId: number; 
  onSendNFT?: (tokenId: bigint, tokenName: string, imgSrc: string, contractAddress: string, chainId: number, abi: any) => void 
}) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [tokenName, setTokenName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [gatewayAttempt, setGatewayAttempt] = useState<number>(0);

  const nftContract = useMemo(() => 
    getContract({ 
      client: thirdwebClient, 
      address: contractAddress, 
      chain: chainId === 56 ? bsc : bscTestnet 
    }), [contractAddress, chainId]);

  // Fetch token URI from contract
  const { data: tokenURI } = useReadContract({
    contract: nftContract,
    method: 'function tokenURI(uint256 tokenId) view returns (string)',
    params: [tokenId],
  });

  // Fetch collection name from contract
  const { data: collectionName } = useReadContract({
    contract: nftContract,
    method: 'function name() view returns (string)',
    params: [],
  });

  // IPFS gateway rotation
  const IPFS_GATEWAYS = [
    'https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/',
    'https://gateway.pinata.cloud/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.ipfs.io/ipfs/',
  ];

  const convertIPFSUrl = (url: string, gatewayIndex: number = 0): string => {
    if (!url.startsWith('ipfs://')) return url;
    const hash = url.replace('ipfs://', '');
    return `${IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length]}${hash}`;
  };

  useEffect(() => {
    let isMounted = true;

    const fetchMetadata = async () => {
      if (!tokenURI) {
        setLoading(false);
        return;
      }

      try {
        const metadataUrl = convertIPFSUrl(tokenURI as string, 0);
        console.log(`🔍 Fetching metadata for token ${tokenId}:`, metadataUrl);

        const response = await fetch(metadataUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const metadata = await response.json();
        console.log(`✅ Metadata loaded for token ${tokenId}:`, metadata);

        if (!isMounted) return;

        // Set token name
        const name = metadata.name || `${collectionName || 'NFT'} #${tokenId.toString()}`;
        setTokenName(name);

        // Determine media URL and type
        let mediaUrl = metadata.animation_url || metadata.image || '';
        const isVideoFile = 
          mediaUrl.toLowerCase().includes('.mp4') ||
          mediaUrl.toLowerCase().includes('.webm') ||
          mediaUrl.toLowerCase().includes('.mov') ||
          !!metadata.animation_url;

        if (mediaUrl) {
          mediaUrl = convertIPFSUrl(mediaUrl, 0);
          setImgSrc(mediaUrl);
          setIsVideo(isVideoFile);
          console.log(`✅ Media set for token ${tokenId}:`, { mediaUrl, isVideoFile });
        } else {
          // Fallback to a generic blockchain/NFT icon (data URI or external)
          setImgSrc('https://via.placeholder.com/400x400/1a1a1a/ffffff?text=SmartSentinels+NFT');
        }
      } catch (error) {
        console.error(`❌ Metadata fetch failed for token ${tokenId}:`, error);
        if (isMounted) {
          setTokenName(`${collectionName || 'NFT'} #${tokenId.toString()}`);
          setImgSrc('https://via.placeholder.com/400x400/1a1a1a/ffffff?text=SmartSentinels+NFT');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMetadata();

    return () => {
      isMounted = false;
    };
  }, [tokenURI, tokenId, collectionName]);

  const handleMediaError = () => {
    console.error(`❌ Media load failed (attempt ${gatewayAttempt + 1}):`, imgSrc);
    
    if (gatewayAttempt < IPFS_GATEWAYS.length - 1) {
      const newAttempt = gatewayAttempt + 1;
      setGatewayAttempt(newAttempt);
      
      if (imgSrc.startsWith('ipfs://') || imgSrc.includes('/ipfs/')) {
        const ipfsHash = imgSrc.split('/ipfs/').pop() || '';
        const newUrl = `${IPFS_GATEWAYS[newAttempt]}${ipfsHash}`;
        console.log(`🔄 Trying gateway ${newAttempt}:`, newUrl);
        setImgSrc(newUrl);
      } else {
        setImgSrc('https://via.placeholder.com/400x400/1a1a1a/ffffff?text=SmartSentinels+NFT');
        setIsVideo(false);
      }
    } else {
      console.log('❌ All gateways exhausted, using fallback');
      setImgSrc('https://via.placeholder.com/400x400/1a1a1a/ffffff?text=SmartSentinels+NFT');
      setIsVideo(false);
    }
  };

  const name = tokenName || `Token #${tokenId.toString()}`;
  const explorer = getTokenExplorerUrl(tokenId, chainId, contractAddress);

  return (
    <div className="nft-card">
      <div className="nft-media">
        {loading ? (
          <div className="nft-loading">
            <Loader className="animate-spin" size={24} />
            <span>Loading...</span>
          </div>
        ) : isVideo ? (
          <video
            src={imgSrc}
            className="nft-video"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            onError={handleMediaError}
          />
        ) : (
          <img
            src={imgSrc || 'https://via.placeholder.com/400x400/1a1a1a/ffffff?text=SmartSentinels+NFT'}
            className="nft-image"
            alt={name}
            onError={handleMediaError}
          />
        )}
      </div>
      <div className="nft-info">
        <div className="nft-title">{name}</div>
        <div className="nft-sub">Token ID: {tokenId.toString()}</div>
        <div className="nft-actions">
          <a href={explorer} target="_blank" rel="noreferrer" className="nft-link">
            View on Explorer
          </a>
          {onSendNFT && (
            <button
              className="nft-send-btn"
              onClick={() => onSendNFT(tokenId, name, imgSrc, contractAddress, chainId, abi)}
              title="Send NFT to another wallet"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarMyNFTs;