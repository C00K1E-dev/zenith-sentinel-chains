"use client";
import { useState, useEffect, useCallback, memo } from "react";
import { useActiveAccount, useSendTransaction, useReadContract } from "thirdweb/react";
import { prepareContractCall, getContract, createThirdwebClient, readContract } from "thirdweb";
import { bsc } from "thirdweb/chains";
import { parseEther, formatUnits } from "viem";
import { AI_AUDIT_ABI, AI_AUDIT_CONTRACT_ADDRESS, AI_AUDIT_CHAIN_ID, SSTL_TOKEN_ADDRESS, SSTL_TOKEN_ABI } from "../contracts/index";

const thirdwebClient = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

const AIAuditMint = memo(({ onMinted }: { onMinted?: (args: { tokenId?: bigint, txHash?: string, imageUrl?: string }) => void }) => {
   const account = useActiveAccount();
   const { mutateAsync: sendTransaction } = useSendTransaction();
   const [authMessage, setAuthMessage] = useState("");
   const [minting, setMinting] = useState(false);
   const [approving, setApproving] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [mintTxHash, setMintTxHash] = useState<string | null>(null);
   const [lastKnownTokenId, setLastKnownTokenId] = useState<bigint>(BigInt(20)); // Start from 20 since user mentioned minting 20
   const [lastMintedTokenId, setLastMintedTokenId] = useState<bigint | null>(null);
   const [callbackTriggered, setCallbackTriggered] = useState(false);
   const [metadataImageUrl, setMetadataImageUrl] = useState<string>('');

   const isConnected = !!account;
   const address = account?.address;

   // Get contracts
   const aiAuditContract = getContract({
     address: AI_AUDIT_CONTRACT_ADDRESS,
     abi: AI_AUDIT_ABI as any,
     chain: bsc,
     client: thirdwebClient,
   } as any);

   const sstlTokenContract = getContract({
     address: SSTL_TOKEN_ADDRESS,
     abi: SSTL_TOKEN_ABI as any,
     chain: bsc,
     client: thirdwebClient,
   } as any);

   // Get total supply to determine next token ID
   const { data: totalSupplyData, isLoading: totalSupplyLoading, error: totalSupplyError, refetch: refetchTotalSupply } = useReadContract({
     contract: aiAuditContract,
     method: 'totalSupply',
     abi: AI_AUDIT_ABI,
   } as any);

   // Get mint price in BNB
   const { data: mintPriceBNB } = useReadContract({
     contract: aiAuditContract,
     method: 'mintAmountBNB',
     abi: AI_AUDIT_ABI,
   } as any);

   // Get mint price in SSTL
   const { data: mintPriceSSTL } = useReadContract({
     contract: aiAuditContract,
     method: 'mintAmountToken',
     abi: AI_AUDIT_ABI,
   } as any);

   // Get payment mode
   const { data: useNativePayment } = useReadContract({
     contract: aiAuditContract,
     method: 'useNativePayment',
     abi: AI_AUDIT_ABI,
   } as any);

   // Check SSTL allowance
   const { data: allowance, refetch: refetchAllowance } = useReadContract({
     contract: sstlTokenContract,
     method: 'allowance',
     params: address ? [address, AI_AUDIT_CONTRACT_ADDRESS] : undefined,
   } as any);

   // Update last known token ID when total supply changes
   useEffect(() => {
     if (totalSupplyData && typeof totalSupplyData === 'bigint') {
       setLastKnownTokenId(totalSupplyData);
     }
   }, [totalSupplyData]);

   // Get user's NFT balance
   const { data: userNFTBalance, refetch: refetchNFTBalance } = useReadContract({
     contract: aiAuditContract,
     method: 'balanceOf',
     params: address ? [address] : undefined,
     abi: AI_AUDIT_ABI,
   } as any);

   // Get token URI for the minted token
   const { data: tokenURIData } = useReadContract({
     contract: aiAuditContract,
     method: 'tokenURI',
     params: lastMintedTokenId ? [lastMintedTokenId] : undefined,
     abi: AI_AUDIT_ABI,
   } as any);

  const handleApproveSSTL = useCallback(async () => {
    if (!isConnected || !address || !mintPriceSSTL) {
      setAuthMessage("Please connect your wallet.");
      return;
    }

    try {
      setApproving(true);
      setAuthMessage("");

      const approveTx = prepareContractCall({
        contract: sstlTokenContract,
        method: 'approve',
        params: [AI_AUDIT_CONTRACT_ADDRESS, mintPriceSSTL],
      } as any);
      const txResult = await sendTransaction(approveTx);
      const txHash = txResult.transactionHash;

      // Wait for allowance to update
      await waitForAllowanceUpdate();

      setAuthMessage("SSTL approved successfully!");
      setTimeout(() => setAuthMessage(""), 3000);
    } catch (e) {
      console.error('Approval failed', e);
      setAuthMessage('Approval failed. Please try again.');
      setTimeout(() => setAuthMessage(""), 5000);
    } finally {
      setApproving(false);
    }
  }, [isConnected, address, mintPriceSSTL, sendTransaction]);

  const waitForAllowanceUpdate = useCallback(async () => {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const newAllowance = await refetchAllowance();
      const requiredAmount = mintPriceSSTL ? BigInt(mintPriceSSTL.toString()) : BigInt(0);
      if (newAllowance.data && BigInt(newAllowance.data.toString()) >= requiredAmount) {
        return;
      }
      attempts++;
    }
    throw new Error('Allowance update timeout');
  }, [refetchAllowance, mintPriceSSTL]);

  const handleMint = useCallback(async () => {
    if (!isConnected || !address) {
      setAuthMessage("Please connect your wallet to mint.");
      return;
    }
    if (!address) {
      setAuthMessage(`Please connect your wallet to mint.`);
      return;
    }

    try {
      setMinting(true);
      setAuthMessage(""); // Clear any previous messages

      // Reset flags for new mint
      setCallbackTriggered(false);
      setLastMintedTokenId(null);
      setMetadataImageUrl('');

      // Get the mint price based on payment mode
      const isNativePayment = !useNativePayment || useNativePayment.toString() !== 'false';
      let mintPrice: bigint;
      let useSSTL = false;

      if (isNativePayment) {
        // Use BNB payment
        mintPrice = mintPriceBNB ? BigInt(mintPriceBNB.toString()) : BigInt("74000000000000000"); // 0.074 BNB fallback
      } else {
        // Use SSTL payment - check allowance first
        useSSTL = true;
        mintPrice = mintPriceSSTL ? BigInt(mintPriceSSTL.toString()) : BigInt(0);
        const requiredAmount = mintPrice;
        if (!allowance || BigInt(allowance.toString()) < requiredAmount) {
          setAuthMessage("Please approve SSTL spending first.");
          return;
        }
      }

      // Calculate expected token ID before minting
      const currentTotalSupply = totalSupplyData ? BigInt(totalSupplyData.toString()) : BigInt(0);
      const expectedTokenId = currentTotalSupply + BigInt(1);

      console.log('=== MINT DEBUG ===');
      console.log('totalSupplyData:', totalSupplyData);
      console.log('totalSupplyData type:', typeof totalSupplyData);
      console.log('currentTotalSupply:', currentTotalSupply.toString());
      console.log('expectedTokenId:', expectedTokenId.toString());
      console.log('mintPrice:', mintPrice.toString());
      console.log('==================');

      // If totalSupply is not available or seems wrong, use fallback
      if (!totalSupplyData || currentTotalSupply === BigInt(0)) {
        console.log('totalSupply not available or zero, trying to refetch...');
        try {
          await refetchTotalSupply();
          // Wait a bit for refetch
          await new Promise(resolve => setTimeout(resolve, 1000));
          const refetchedTotalSupply = totalSupplyData ? BigInt(totalSupplyData.toString()) : BigInt(0);
          console.log('Refetched totalSupply:', refetchedTotalSupply.toString());

          if (refetchedTotalSupply > BigInt(0)) {
            const correctedTokenId = refetchedTotalSupply + BigInt(1);
            setLastMintedTokenId(correctedTokenId);
            setLastKnownTokenId(correctedTokenId);
            console.log('Using refetched totalSupply, token ID:', correctedTokenId.toString());
          } else {
            // Still no data, use incremental fallback
            const fallbackTokenId = lastKnownTokenId + BigInt(1);
            setLastMintedTokenId(fallbackTokenId);
            setLastKnownTokenId(fallbackTokenId);
            console.log('Using incremental fallback token ID:', fallbackTokenId.toString());
          }
        } catch (error) {
          console.error('Error refetching totalSupply:', error);
          const fallbackTokenId = lastKnownTokenId + BigInt(1);
          setLastMintedTokenId(fallbackTokenId);
          setLastKnownTokenId(fallbackTokenId);
          console.log('Using incremental fallback token ID after error:', fallbackTokenId.toString());
        }
      } else {
        // Set the expected token ID immediately
        setLastMintedTokenId(expectedTokenId);
        setLastKnownTokenId(expectedTokenId);
        console.log('Set lastMintedTokenId to expected ID:', expectedTokenId.toString());
      }

      // Now mint the NFT
      console.log(`Attempting to mint NFT with ${useSSTL ? 'SSTL' : 'BNB'}...`);
      console.log('Mint price (wei):', mintPrice.toString());

      const mintTx = prepareContractCall({
        contract: aiAuditContract,
        method: 'publicMint',
        params: [],
        value: useSSTL ? BigInt(0) : mintPrice,
      } as any);
      console.log('Prepared mint transaction:', mintTx);
      const txResult = await sendTransaction(mintTx);
      const txHash = txResult.transactionHash;

      setMintTxHash(txHash);
      // Set the expected token ID immediately
      setLastMintedTokenId(expectedTokenId);
      setLastKnownTokenId(expectedTokenId);
      console.log('Set lastMintedTokenId to expected ID:', expectedTokenId.toString());

      // Set up verification after transaction broadcast
      console.log('Transaction sent, setting up verification...');
        
      // Initial verification after a short delay for the transaction to propagate
      setTimeout(async () => {
        try {
          console.log('Performing initial supply verification...');
          await refetchTotalSupply();
          const newTotalSupply = totalSupplyData ? BigInt(totalSupplyData.toString()) : BigInt(0);
          console.log('Initial verified totalSupply:', newTotalSupply.toString());

          if (newTotalSupply > expectedTokenId) {
            console.log('Supply increased, updating token ID to:', newTotalSupply.toString());
            setLastMintedTokenId(newTotalSupply);
            setLastKnownTokenId(newTotalSupply);
          }
          
          // Additional verification after a longer delay
          setTimeout(async () => {
            try {
              console.log('Performing final supply verification...');
              await refetchTotalSupply();
              const finalTotalSupply = totalSupplyData ? BigInt(totalSupplyData.toString()) : BigInt(0);
              console.log('Final verified totalSupply:', finalTotalSupply.toString());
              
              if (finalTotalSupply > newTotalSupply) {
                console.log('Final supply update detected:', finalTotalSupply.toString());
                setLastMintedTokenId(finalTotalSupply);
                setLastKnownTokenId(finalTotalSupply);
              }
            } catch (error) {
              console.error('Error in final supply verification:', error);
            }
          }, 10000); // 10 seconds for final verification
        } catch (error) {
          console.error('Error in initial supply verification:', error);
        }
      }, 3000); // 3 seconds for initial verification

      // Clear all messages after successful mint
      setTimeout(() => setAuthMessage(""), 2000);

    } catch (e) {
      console.error('Mint failed', e);
      setAuthMessage('Mint failed. Please try again.');
      // Clear error message after 5 seconds
      setTimeout(() => setAuthMessage(""), 5000);
    } finally {
      setMinting(false);
    }
  }, [isConnected, address, sendTransaction, mintPriceBNB, mintPriceSSTL, useNativePayment, allowance]);

  // The token ID is set immediately in handleMint, no need for additional logic here

  // Fetch metadata when we have tokenURI
  useEffect(() => {
    const fetchMetadata = async () => {
      if (tokenURIData && lastMintedTokenId && !metadataImageUrl) {
        // Only fetch if we haven't set a custom image URL yet
        const tokenURIString = tokenURIData.toString();
        console.log('=== METADATA FETCH ===');
        console.log('Token ID:', lastMintedTokenId.toString());
        console.log('Token URI:', tokenURIString);

        // Add a small delay to ensure token exists
        await new Promise(resolve => setTimeout(resolve, 2000));

        try {
          // If tokenURI is an IPFS URL or HTTP URL, fetch the metadata
          if (tokenURIString.startsWith('http') || tokenURIString.startsWith('ipfs://')) {
            let metadataUrl = tokenURIString;
            if (tokenURIString.startsWith('ipfs://')) {
              // Convert IPFS URL to HTTP gateway
              metadataUrl = tokenURIString.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }

            console.log('Fetching metadata from:', metadataUrl);
            const response = await fetch(metadataUrl);
            const metadata = await response.json();
            console.log('Fetched metadata:', metadata);

            // Extract image URL from metadata
            if (metadata.image) {
              let imageUrl = metadata.image;
              if (imageUrl.startsWith('ipfs://')) {
                imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
              }

              // Only update if we got a valid-looking URL
              if (imageUrl.startsWith('http') || imageUrl.startsWith('https://')) {
                setMetadataImageUrl(imageUrl);
                console.log('Set metadata image URL:', imageUrl);
              } else {
                console.log('Invalid image URL in metadata:', imageUrl);
                // Don't update - keep the fallback
              }
            } else {
              // No image in metadata, keep the fallback
              console.log('No image in metadata, keeping fallback');
            }
          } else {
            // If it's not a URL, assume it's a data URI or direct image
            console.log('Token URI is not a URL, using as direct image');
            setMetadataImageUrl(tokenURIString);
          }
        } catch (error) {
          console.error('Error fetching metadata:', error);
          // Keep the fallback image
          console.log('Metadata fetch failed, keeping fallback');
        }
        console.log('=== METADATA FETCH END ===');
      } else {
        console.log('Metadata fetch skipped - tokenURIData:', !!tokenURIData, 'lastMintedTokenId:', lastMintedTokenId, 'metadataImageUrl:', metadataImageUrl);
      }
    };

    fetchMetadata();
  }, [tokenURIData, lastMintedTokenId, metadataImageUrl]);

  // Trigger onMinted callback when mint is successful (only once)
  useEffect(() => {
    if (lastMintedTokenId && mintTxHash && !callbackTriggered) {
      console.log('Triggering onMinted callback for token:', lastMintedTokenId.toString());
      setCallbackTriggered(true);

      // Trigger onMinted callback for parent component to handle overlay
      if (onMinted) {
        onMinted({
          tokenId: lastMintedTokenId,
          txHash: mintTxHash,
          imageUrl: metadataImageUrl || '/assets/AIAuditNFT.png'
        });
      }
    }
  }, [lastMintedTokenId, mintTxHash, onMinted, callbackTriggered, metadataImageUrl]);

  // Debug logging
  useEffect(() => {
    console.log('Address:', address);
    console.log('AI_AUDIT_CONTRACT_ADDRESS:', AI_AUDIT_CONTRACT_ADDRESS);
    console.log('Mint Price BNB:', mintPriceBNB?.toString());
  }, [address, mintPriceBNB]);

  return (
    <>
      <div className="space-y-2">
        {/* Approval Button for SSTL */}
        {(!useNativePayment || useNativePayment.toString() === 'false') && allowance && mintPriceSSTL && BigInt(allowance.toString()) < BigInt(mintPriceSSTL.toString()) && (
          <button
            className={`nft-mint-btn ${approving ? 'disabled' : ''}`}
            onClick={handleApproveSSTL}
            disabled={approving}
          >
            {approving ? 'Approving…' : `Approve SSTL (${formatUnits(BigInt(mintPriceSSTL.toString()), 18)} SSTL)`}
          </button>
        )}

        {/* Mint Button */}
        <button
          className={`nft-mint-btn ${minting ? 'disabled' : ''}`}
          onClick={handleMint}
          disabled={minting || ((!useNativePayment || useNativePayment.toString() === 'false') && allowance && mintPriceSSTL && BigInt(allowance.toString()) < BigInt(mintPriceSSTL.toString()))}
        >
          {minting ? 'Minting…' : 'Mint AI Audit'}
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

AIAuditMint.displayName = 'AIAuditMint';

export default AIAuditMint;