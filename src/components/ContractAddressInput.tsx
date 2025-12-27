import React, { useState } from 'react';
import { Search, Loader2, ExternalLink, AlertCircle, CheckCircle2, Info, FlaskConical, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChainSelector, SUPPORTED_CHAINS } from '@/components/ChainSelector';
import {
  fetchContractSourceCode,
  isValidAddress,
  getExplorerUrl,
  type ContractSourceCode,
} from '@/services/etherscan';

interface ContractAddressInputProps {
  onCodeFetched: (code: string, contractInfo: ContractSourceCode) => void;
  disabled?: boolean;
  onExampleAudit?: (contractAddress: string, chainId: string) => void;
}



export const ContractAddressInput: React.FC<ContractAddressInputProps> = ({
  onCodeFetched,
  disabled = false,
  onExampleAudit,
}) => {
  const [contractAddress, setContractAddress] = useState('');
  const [selectedChainId, setSelectedChainId] = useState('1'); // Ethereum mainnet
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedChain = SUPPORTED_CHAINS.find(c => c.chainId === selectedChainId);

  const handleFetchContract = async () => {
    setError(null);
    setSuccess(null);

    if (!selectedChain?.available) {
      setError(`${selectedChain?.shortName || 'This chain'} is not available yet. Coming soon!`);
      return;
    }

    if (!contractAddress.trim()) {
      setError('Please enter a contract address');
      return;
    }

    const trimmedAddress = contractAddress.trim();

    if (!isValidAddress(trimmedAddress)) {
      setError('Invalid address format. Must be a valid 0x address (42 characters)');
      return;
    }

    if (trimmedAddress.toLowerCase() === '0x0000000000000000000000000000000000000000') {
      setError('Cannot audit the zero address (0x0000...0000)');
      return;
    }

    setIsLoading(true);

    try {
      const contractInfo = await fetchContractSourceCode(trimmedAddress, selectedChainId);
      
      setSuccess(`✅ Successfully fetched ${contractInfo.contractName}`);
      
      onCodeFetched(contractInfo.sourceCode, contractInfo);
      
      setTimeout(() => {
        setContractAddress('');
        setSuccess(null);
      }, 3000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch contract';
      setError(errorMessage);
      console.error('Error fetching contract:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled && !isLoading) {
      handleFetchContract();
    }
  };

  const explorerUrl = contractAddress && isValidAddress(contractAddress) 
    ? getExplorerUrl(contractAddress, selectedChainId)
    : null;

  const handleExampleAudit = async (address: string, chainId: string) => {
    if (!onExampleAudit) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const contractInfo = await fetchContractSourceCode(address, chainId);
      setSuccess(`✅ Fetching ${contractInfo.contractName} for example audit...`);
      onCodeFetched(contractInfo.sourceCode, contractInfo);
      
      // Small delay to let the code populate
      setTimeout(() => {
        onExampleAudit(address, chainId);
        setSuccess(null);
      }, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch contract';
      setError(errorMessage);
      console.error('Error fetching example contract:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Chain Selector */}
      <div>
        <label className="block text-sm font-medium mb-2 font-orbitron">
          Select Blockchain:
        </label>
        <ChainSelector
          selectedChainId={selectedChainId}
          onChainSelect={setSelectedChainId}
          disabled={disabled || isLoading}
        />
      </div>

      {/* Contract Address Input */}
      <div>
        <label className="block text-sm font-medium mb-2 font-orbitron">
          Contract Address:
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              value={contractAddress}
              onChange={(e) => {
                setContractAddress(e.target.value);
                setError(null);
                setSuccess(null);
              }}
              onKeyPress={handleKeyPress}
              placeholder="0x..."
              disabled={disabled || isLoading}
              className="pr-10 font-mono text-sm"
            />
            {explorerUrl && (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-400 transition-colors"
                title="View on explorer"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          
          <Button
            onClick={handleFetchContract}
            disabled={disabled || isLoading || !contractAddress.trim()}
            className="px-4"
            variant="outline"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Fetch
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="glass-card p-4 bg-red-500/5 border-red-500/20">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground whitespace-pre-wrap">
              <strong className="text-red-400">Error:</strong> {error}
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="glass-card p-4 bg-green-500/5 border-green-500/20">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-foreground">{success}</div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="glass-card p-4 bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-2 mb-2">
          <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            <strong className="font-semibold text-blue-400">Requirements:</strong> Only verified smart contracts can be audited via address.
          </p>
        </div>
        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer hover:text-foreground font-medium mb-2 flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-blue-400" />
            Test Contracts & Info
          </summary>
          <div className="mt-3 space-y-3">
            <div>
              <p className="font-medium mb-2 text-foreground">Click to Fill Address then fetch and Run Test Audit:</p>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setContractAddress('0xdAC17F958D2ee523a2206206994597C13D831ec7');
                      setSelectedChainId('1');
                    }}
                    className="flex-1 text-left font-mono text-xs bg-muted hover:bg-primary/10 p-2 rounded-lg transition-colors"
                  >
                    <strong className="text-primary">ETH USDT:</strong> <span className="text-muted-foreground">0xdAC1...1ec7</span>
                  </button>
                  <button
                    onClick={() => handleExampleAudit('0xdAC17F958D2ee523a2206206994597C13D831ec7', '1')}
                    disabled={isLoading || disabled}
                    className="px-3 py-2 text-xs bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Run test audit (no payment required)"
                  >
                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                    Run Test
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setContractAddress('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
                      setSelectedChainId('1');
                    }}
                    className="flex-1 text-left font-mono text-xs bg-muted hover:bg-primary/10 p-2 rounded-lg transition-colors"
                  >
                    <strong className="text-primary">ETH USDC:</strong> <span className="text-muted-foreground">0xA0b8...eB48</span>
                  </button>
                  <button
                    onClick={() => handleExampleAudit('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', '1')}
                    disabled={isLoading || disabled}
                    className="px-3 py-2 text-xs bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Run test audit (no payment required)"
                  >
                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                    Run Test
                  </button>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-border text-xs text-muted-foreground flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <span><span className="text-yellow-400 font-semibold">BSC V2 Migration Issues</span> - BscScan API endpoint not responding</span>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};
