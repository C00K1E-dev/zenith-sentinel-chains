import { useState, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ExternalLink, X, CheckCircle, Loader } from 'lucide-react';

interface MintSuccessOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onViewNFTs?: () => void;
  tokenId?: bigint;
  txHash?: string;
  imageUrl?: string;
  collectionName?: string;
}

const MintSuccessOverlay: React.FC<MintSuccessOverlayProps> = memo(({
  isOpen,
  onClose,
  onViewNFTs,
  tokenId,
  txHash,
  imageUrl,
  collectionName = "AI Audit NFT"
}) => {
  console.log('MintSuccessOverlay render, isOpen:', isOpen);
  const [loading, setLoading] = useState(true);
  const [mediaUrl, setMediaUrl] = useState<string>('');

  const [imageError, setImageError] = useState(false);

  const IPFS_GATEWAYS = [
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.pinata.cloud/ipfs/'
  ];

  const getFallbackImage = (collection: string) => {
    // Use collection-specific SVG paths as fallbacks
    switch (collection.toLowerCase()) {
      case 'genesis':
      case 'genesis nft':
      case 'genesis collection':
        return '/assets/genesisNFT.webp';
      case 'ai audit':
      case 'ai audit nft':
      case 'ai audit collection':
        return '/assets/AIAuditNFT.webp';
      case 'aida':
      case 'aida nft':
      case 'aida collection':
        return '/assets/aida.webp';
      default:
        return '/placeholder.svg';
    }
  };

  const getIPFSUrl = (url: string) => {
    if (!url) return getFallbackImage(collectionName);
    if (url.startsWith('ipfs://')) {
      const hash = url.replace('ipfs://', '');
      return `${IPFS_GATEWAYS[0]}${hash}`;
    }
    return url;
  };

  useEffect(() => {
    console.log('MintSuccessOverlay imageUrl effect:', { isOpen, imageUrl, collectionName });
    if (isOpen && imageUrl) {
      setMediaUrl(getIPFSUrl(imageUrl));
      setLoading(false);
      setImageError(false); // Reset error state when URL changes
    } else if (isOpen) {
      setMediaUrl(getFallbackImage(collectionName));
      setLoading(false);
      setImageError(false);
    }
  }, [isOpen, imageUrl, collectionName]);

  const handleImageError = () => {
    console.log('Image failed to load:', mediaUrl);
    
    // Try next IPFS gateway if current URL is from IPFS
    if (imageUrl?.startsWith('ipfs://')) {
      const currentGateway = IPFS_GATEWAYS.find(gateway => mediaUrl.startsWith(gateway));
      const currentIndex = currentGateway ? IPFS_GATEWAYS.indexOf(currentGateway) : -1;
      
      if (currentIndex < IPFS_GATEWAYS.length - 1) {
        // Try next gateway
        const hash = imageUrl.replace('ipfs://', '');
        const nextGateway = IPFS_GATEWAYS[currentIndex + 1];
        setMediaUrl(`${nextGateway}${hash}`);
        return;
      }
    }
    
    // If all gateways failed or not an IPFS URL, fallback to default
    setImageError(true);
    setMediaUrl(getFallbackImage(collectionName));
    setLoading(false);
  };

  const getExplorerUrl = (hash: string) => {
    return `https://bscscan.com/tx/${hash}`;
  };

  const isVideo = mediaUrl?.includes('.mp4') || mediaUrl?.includes('.webm');

  return createPortal(
    isOpen ? (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
          style={{ zIndex: 999999 }}
          onClick={onClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 1000000 }}
        >
          <div className="glass-card p-6 md:p-8 rounded-xl max-w-md w-full mx-4 relative" onClick={(e) => e.stopPropagation()} style={{ pointerEvents: 'auto' }}>
            {/* Close button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Close button clicked');
                onClose();
              }}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors z-50 cursor-pointer"
              style={{ pointerEvents: 'auto' }}
            >
              <X size={20} className="text-muted-foreground" />
            </button>

            {/* Success header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4"
              >
                <CheckCircle size={32} className="text-green-400" />
              </motion.div>
              <h2 className="text-2xl md:text-3xl font-orbitron font-bold text-foreground mb-2">
                Mint Successful!
              </h2>
              <p className="text-muted-foreground">
                Your {collectionName} has been minted successfully
              </p>
            </div>

            {/* NFT Preview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 mb-4">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader className="animate-spin text-primary" size={32} />
                  </div>
                ) : isVideo ? (
                  <video
                    src={mediaUrl}
                    className="w-full h-full object-contain"
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={handleImageError}
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt={`${collectionName} #${tokenId?.toString()}`}
                    className="w-full h-full object-contain"
                    onError={handleImageError}
                  />
                )}
              </div>

              <div className="text-center">
                <h3 className="text-lg md:text-xl font-orbitron font-bold text-foreground mb-1">
                  {collectionName} #{tokenId?.toString()}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Token ID: {tokenId?.toString()}
                </p>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-3"
            >
              {txHash && (
                <button
                  onClick={() => window.open(getExplorerUrl(txHash), '_blank')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-colors"
                >
                  <ExternalLink size={16} />
                  <span className="text-sm font-medium">View Transaction</span>
                </button>
              )}

              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Close button in actions clicked');
                    onClose();
                  }}
                  className="flex-1 px-4 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors text-sm font-medium cursor-pointer"
                  style={{ pointerEvents: 'auto' }}
                >
                  Close
                </button>
                {onViewNFTs && (
                  <button
                    onClick={() => {
                      onViewNFTs();
                      onClose();
                    }}
                    className="flex-1 px-4 py-3 bg-primary hover:bg-primary/90 rounded-lg transition-colors text-sm font-medium text-primary-foreground"
                  >
                    View My NFTs
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </>
    ) : null,
    document.body
  );
});

MintSuccessOverlay.displayName = 'MintSuccessOverlay';

export default MintSuccessOverlay;