"use client";
import { useState, useEffect, useCallback, memo } from "react";
import { useActiveAccount, useSendTransaction, useReadContract } from "thirdweb/react";
import { prepareContractCall, getContract, createThirdwebClient, readContract } from "thirdweb";
import { bscTestnet } from "thirdweb/chains";
import { parseEther, formatUnits } from "viem";
import { GENESIS_ABI, GENESIS_CONTRACT_ADDRESS, GENESIS_CHAIN_ID, SSTL_TOKEN_ADDRESS, SSTL_TOKEN_ABI } from "../contracts/index";

const thirdwebClient = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

const GenesisMint = memo(({ onMinted }: { onMinted?: (args: { tokenId?: bigint, txHash?: string, imageUrl?: string }) => void }) => {
    const account = useActiveAccount();
    const { mutateAsync: sendTransaction } = useSendTransaction();
    const [authMessage, setAuthMessage] = useState("");
    const [minting, setMinting] = useState(false);
    const [approving, setApproving] = useState(false);
    const [mintTxHash, setMintTxHash] = useState<string | null>(null);
    const [lastMintedTokenId, setLastMintedTokenId] = useState<bigint | null>(null);
    const [callbackTriggered, setCallbackTriggered] = useState(false);

    const isConnected = !!account;
    const address = account?.address;

    // Get Genesis contract
    const genesisContract = getContract({
      address: GENESIS_CONTRACT_ADDRESS,
      abi: GENESIS_ABI as any,
      chain: bscTestnet,
      client: thirdwebClient,
    } as any);

    // Get SSTL Token contract
    const sstlTokenContract = getContract({
      address: SSTL_TOKEN_ADDRESS,
      abi: SSTL_TOKEN_ABI as any,
      chain: bscTestnet,
      client: thirdwebClient,
    } as any);

   // Read mint price in BNB from contract
   const { data: mintAmountBNB } = useReadContract({
     contract: genesisContract,
     method: 'mintAmountBNB',
   } as any);

   // Read mint price in SSTL tokens from contract
   const { data: mintAmountToken } = useReadContract({
     contract: genesisContract,
     method: 'mintAmountToken',
   } as any);

   // Read payment mode from contract (true = BNB, false = SSTL)
   const { data: useNativePayment } = useReadContract({
     contract: genesisContract,
     method: 'useNativePayment',
   } as any);

   // Check SSTL allowance for the Genesis contract
   const { data: allowance, refetch: refetchAllowance } = useReadContract({
     contract: sstlTokenContract,
     method: 'allowance',
     params: address ? [address, GENESIS_CONTRACT_ADDRESS] : undefined,
   } as any);

  // Wait for allowance to update after approval
  const waitForAllowanceUpdate = useCallback(async () => {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const newAllowance = await refetchAllowance();
      const requiredAmount = mintAmountToken ? BigInt(mintAmountToken.toString()) : BigInt(0);
      if (newAllowance.data && BigInt(newAllowance.data.toString()) >= requiredAmount) {
        return;
      }
      attempts++;
    }
    throw new Error('Allowance update timeout');
  }, [refetchAllowance, mintAmountToken]);

  // Handle SSTL token approval
  const handleApproveSSTL = useCallback(async () => {
    if (!isConnected || !address || !mintAmountToken) {
      setAuthMessage("Please connect your wallet.");
      return;
    }

    try {
      setApproving(true);
      setAuthMessage("");

      const approveTx = prepareContractCall({
        contract: sstlTokenContract,
        method: 'approve',
        params: [GENESIS_CONTRACT_ADDRESS, mintAmountToken],
      } as any);
      
      const txResult = await sendTransaction(approveTx);
      console.log('Approval tx:', txResult.transactionHash);

      // Wait for allowance to update
      await waitForAllowanceUpdate();

      setAuthMessage("SSTL approved successfully! You can now mint.");
      setTimeout(() => setAuthMessage(""), 3000);
    } catch (e) {
      console.error('Approval failed', e);
      setAuthMessage('Approval failed. Please try again.');
      setTimeout(() => setAuthMessage(""), 5000);
    } finally {
      setApproving(false);
    }
  }, [isConnected, address, mintAmountToken, sendTransaction, sstlTokenContract, waitForAllowanceUpdate]);

  const handleMint = useCallback(async (quantity: number) => {
    if (!isConnected || !address) {
      setAuthMessage("Please connect your wallet to mint.");
      return;
    }
    
    // Determine if using BNB or SSTL payment
    const isUsingBNB = !useNativePayment || useNativePayment.toString() !== 'false';
    
    // Get dynamic mint price based on payment mode
    let valueWei: bigint = BigInt(0);
    
    if (isUsingBNB) {
      // Using BNB payment
      if (mintAmountBNB && typeof mintAmountBNB === 'bigint') {
        valueWei = mintAmountBNB;
      } else if (mintAmountBNB && typeof mintAmountBNB === 'string') {
        valueWei = BigInt(mintAmountBNB);
      } else {
        // Fallback price
        valueWei = parseEther("0.074");
      }
    } else {
      // Using SSTL payment - check allowance first
      const requiredAmount = mintAmountToken ? BigInt(mintAmountToken.toString()) : BigInt(0);
      if (!allowance || BigInt(allowance.toString()) < requiredAmount) {
        setAuthMessage("Please approve SSTL tokens first.");
        return;
      }
    }
    
    try {
      setMinting(true);
      setAuthMessage("");
      setMintTxHash(null);
      setLastMintedTokenId(null);
      setCallbackTriggered(false);
      
      const mintTx = prepareContractCall({
        contract: genesisContract,
        method: 'publicMint',
        params: [],
        value: isUsingBNB ? valueWei : BigInt(0), // Only send value if using BNB
      } as any);
      
      const txResult = await sendTransaction(mintTx);
      const txHash = txResult.transactionHash;
      setMintTxHash(txHash);
      // Removed message - MintSuccessOverlay will handle it
    } catch (e) {
      console.error('Mint failed', e);
      setAuthMessage('Mint failed. Please try again.');
    } finally {
      setMinting(false);
    }
  }, [isConnected, address, sendTransaction, mintAmountBNB, mintAmountToken, useNativePayment, allowance, genesisContract]);

  // For now, we'll use a simple timeout to simulate waiting for the transaction
  // In a real implementation, you'd use thirdweb's transaction receipt hooks

  const { data: totalSupply, isLoading: isSupplyLoading } = useReadContract({
    contract: genesisContract,
    method: 'totalSupply',
    abi: GENESIS_ABI,
  } as any);

  // Effect to handle successful mint
  useEffect(() => {
    if (!mintTxHash || !address || !totalSupply || typeof totalSupply !== 'bigint') return;

    const handleMintSuccess = async () => {
      try {
        setLastMintedTokenId(totalSupply);
        
        if (onMinted) {
          const baseURI = `https://smartsentinels.net/metadata/genesis/`;
          onMinted({
            tokenId: totalSupply as bigint,
            txHash: mintTxHash,
            imageUrl: `${baseURI}${(totalSupply as bigint).toString()}`
          });
        }
      } catch (error) {
        console.error('Error handling mint success:', error);
        // Removed authMessage - overlay handles success display
      }
    };

    handleMintSuccess();
  }, [mintTxHash, address, lastMintedTokenId]);

  // Fetch image URL from metadata and trigger onMinted callback
  useEffect(() => {
    if (!lastMintedTokenId || !mintTxHash || callbackTriggered) return;

    const fetchMetadata = async () => {
      try {
        console.log('Triggering mint callback for token:', lastMintedTokenId.toString());
        setCallbackTriggered(true);
        
        // Since all NFTs use the same media, use the fixed URL
        const fixedMediaUrl = 'https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafybeiha5tkjbjz5czjtu3nyldovsc6kdlqcf5ebstirvj4mi26wio2lmi/genesisNFT.mp4';
        
        if (onMinted) {
          onMinted({ 
            tokenId: lastMintedTokenId, 
            txHash: mintTxHash,
            imageUrl: fixedMediaUrl
          });
        }
      } catch (e) {
        console.error('Error in mint callback:', e);
      }
    };

    // Small delay to ensure contract state is updated
    const timer = setTimeout(fetchMetadata, 1000);
    return () => clearTimeout(timer);
  }, [lastMintedTokenId, mintTxHash, callbackTriggered, onMinted]);

  return (
    <>
      <div className="space-y-2">
        {/* Approval Button for SSTL (only show if using SSTL and not approved) */}
        {(!useNativePayment || useNativePayment.toString() === 'false') && 
         allowance && mintAmountToken && 
         BigInt(allowance.toString()) < BigInt(mintAmountToken.toString()) && (
          <button
            className={`nft-mint-btn ${approving ? 'disabled' : ''}`}
            onClick={handleApproveSSTL}
            disabled={approving}
          >
            {approving ? 'Approving…' : `Approve SSTL (${formatUnits(BigInt(mintAmountToken.toString()), 18)} SSTL)`}
          </button>
        )}

        {/* Mint Button */}
        <button
          className={`nft-mint-btn ${minting ? 'disabled' : ''}`}
          onClick={() => handleMint(1)}
          disabled={minting || ((!useNativePayment || useNativePayment.toString() === 'false') && 
                    allowance && mintAmountToken && 
                    BigInt(allowance.toString()) < BigInt(mintAmountToken.toString()))}
        >
          {minting ? 'Minting…' : 'Mint Genesis'}
        </button>
      </div>

      {authMessage && (
        <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{authMessage}</p>
        </div>
      )}
    </>
  );
});

GenesisMint.displayName = 'GenesisMint';

export default GenesisMint;
