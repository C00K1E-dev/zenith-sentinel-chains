# SmartSentinels PoUW Architecture Plan

## Executive Summary

This document outlines the complete architecture for the SmartSentinels Proof of Useful Work (PoUW) system. The design is **modular and scalable**, allowing unlimited AI agents and NFT collections to be added over time, while keeping the already-deployed token contract unchanged.

---

## Current State (Already Deployed)

### ✅ SmartSentinelsToken (SSTL)
- **Status**: Deployed and verified on BSC Testnet
- **Address**: `0x25A48743cE22d68500763b4556026a8863C07555`
- **Function**: Simple ERC-20 with `mintPoUW()` accessible by `MCP_OPERATOR_ROLE`
- **Action Required**: ⚠️ **DO NOT MODIFY** - Already verified on BSCScan

### ✅ SmartSentinelsGenesis NFT
- **Status**: Deployed on BSC Testnet
- **Address**: `0x51e3F92f65A4CFB43b923215053f87E43B98F5B2`
- **Purpose**: Revenue sharing from all future NFT sales + 100% staking yield boost
- **Rewards**: 10% of NFT mint revenue (not from PoUW mining)
- **Constructor Args**:
  - `initBaseURI`: `https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafkreibkuuv5ni6kzvhwatz7wqptix7cnjb2tzdxi2mwbsdsdmeo2ldnfy`
  - `initContractURI`: `https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafkreidhoa6uvk2wh7sori77ypzl432pe6pscghwzxvvqxgt6saeewtjdq`
  - `initMediaBaseURI`: `https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafybeiflizaesh5mzqakmkz33jyfsamisnv3cxb772sfsdsj2q5qwdj334`
  - `initPaymentToken`: `0x25A48743cE22d68500763b4556026a8863C07555`

### ✅ SmartSentinelsAIAuditNFT
- **Status**: Deployed on BSC Testnet
- **Address**: `0x5d481fc291e07DEed888cfdC2503f5b941bf1F72`
- **Purpose**: NFT collection for AI Audit agent (holders receive PoUW rewards)
- **Constructor Args**:
  - `initBaseURI`: `https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafkreifjhcmcs7z2abcfxxjvzov7uo52gt77zzg5sm2afkgmltgvgljpfi`
  - `initContractURI`: `https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafkreigqgaftcbindkqivwul6jx5xy55b5qdvjos4mvxbzj4mtysvhwqsi`
  - `initMediaBaseURI`: `https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafybeidamro3q34rfekck2w7bh5vskhkxpado6fcoeamglhmrgd4ervn6i`
  - `initPaymentToken`: `0x25A48743cE22d68500763b4556026a8863C07555`

### ✅ SmartSentinelsPoUW
- **Status**: Deployed on BSC Testnet
- **Address**: `0x15fBce4D325939b3C1A4719D67DE0AC94fC0088e`
- **Purpose**: Central distribution hub for PoUW rewards and Genesis revenue
- **Constructor Args**:
  - `_sstlToken`: `0x25A48743cE22d68500763b4556026a8863C07555`
  - `_genesisCollection`: `0x51e3F92f65A4CFB43b923215053f87E43B98F5B2`
  - `_treasuryWallet`: `0x17AEC1Fe4397a1b55FeFE66C5Ec883b780a7Fa82`
  - `_serviceOwner`: `0x46e451d555ebCB4ccE5087555a07F6e69D017b05`
  - `admin`: `0x53FF3FB6f8CFb648626F8179856FA7f38A2e3DeB`

### ✅ AIAuditAgentGateway
- **Status**: Deployed on BSC Testnet
- **Address**: `0x859B9A1942f22ebc420886E649C34bEaC4149FBa` (3rd deployment - includes tokenByIndex fix)
- **Purpose**: Payment processor and job executor for AI Audit agent
- **Key Fix**: Uses `tokenByIndex(i)` instead of `ownerOf(i)` to support NFTs starting from tokenId 1
- **Constructor Args**:
  - `_sstlToken`: `0x25A48743cE22d68500763b4556026a8863C07555`
  - `_paymentToken`: `0x25A48743cE22d68500763b4556026a8863C07555`
  - `_nftCollection`: `0x5d481fc291e07DEed888cfdC2503f5b941bf1F72`
  - `_pouwContract`: `0x15fBce4D325939b3C1A4719D67DE0AC94fC0088e`
  - `_treasuryWallet`: `0x17AEC1Fe4397a1b55FeFE66C5Ec883b780a7Fa82`
  - `_serviceOwner`: `0x46e451d555ebCB4ccE5087555a07F6e69D017b05`
  - `admin`: `0x53FF3FB6f8CFb648626F8179856FA7f38A2e3DeB`

---

## ⚠️ Critical Implementation Notes (Testnet Learnings)

### Issue 1: Custom Role Hashes
**Problem**: Initial deployment failed because role hashes didn't match between contracts.

**Root Cause**: 
- Token contract uses `keccak256("MCP_OPERATOR_ROLE")` = `0xb2b79e21bd6877b2d65bf60cc9e0674084ef1b390eab9bf4621eaeb12d01f1c2`
- PoUW contract uses custom `GATEWAY_ROLE()` = `0xb90e9995c6170fff8ea03e9ad6919878e483770c237f1a6f330ceaa7112b344a`
- Gateway was initially using different role name causing hash mismatch

**Solution**: 
- Always query the actual role hash from deployed contracts using `MCP_OPERATOR_ROLE()` or `GATEWAY_ROLE()` view functions
- Update Gateway contract to match Token's role name exactly
- Use these exact hashes when granting roles

**Mainnet Action**: 
- Query role hashes from deployed contracts before granting roles
- Never assume standard keccak256 hashes

---

### Issue 2: NFT Token ID Indexing
**Problem**: Gateway transaction failed with "ERC721: invalid token ID" when iterating NFT holders.

**Root Cause**:
- Both Genesis and AI Audit NFTs start from tokenId **1**, not 0
- Gateway was using `for (i=0; i<totalSupply; i++) ownerOf(i)` which fails at i=0

**Solution**:
- Changed to use `IERC721Enumerable.tokenByIndex(i)` to get actual token IDs
- Code pattern:
```solidity
for (uint256 i = 0; i < totalSupply; i++) {
    uint256 tokenId = nftCollection.tokenByIndex(i);  // Get actual tokenId
    address holder = nftCollection.ownerOf(tokenId);  // Now use the correct ID
    // ... distribute rewards
}
```

**Mainnet Action**:
- Gateway already includes this fix (deployment #3)
- No changes needed for mainnet

---

### Issue 3: Missing Transaction Parameter
**Problem**: Frontend sending transaction with only function selector `0x07d29e5d`, missing required `txHash` parameter.

**Root Cause**:
- Using `sendTransaction({ data: functionSelector })` instead of proper contract interaction
- `payAndRunAuditBNB(string calldata txHash)` requires a string parameter

**Solution**:
- Changed frontend to use wagmi's `writeContract`:
```typescript
await writeContract({
  address: AUDIT_GATEWAY_ADDRESS,
  abi: AUDIT_GATEWAY_ABI,
  functionName: 'payAndRunAuditBNB',
  args: [`audit_${Date.now()}`],  // Properly encoded parameter
  value: parseEther('0.1')
})
```

**Mainnet Action**:
- Frontend already fixed
- No changes needed for mainnet

---

### Issue 4: UI Currency Mixing
**Problem**: Dashboard showing "Total Earned: 40.2074 SSTL" by incorrectly adding SSTL + BNB values.

**Root Cause**:
- Genesis revenue is in BNB (from NFT mint fees)
- PoUW rewards are in SSTL (from job distribution)
- Cannot aggregate different currencies into single number

**Solution**:
- Removed "Total Earned" card completely
- Split into separate displays:
  - "Total Claimable: 40.2000 SSTL + 0.0074 BNB"
- Two separate claim buttons:
  - "Claim Rewards" → calls `claimAllRewards()` for SSTL
  - "Claim Genesis Revenue" → calls `batchClaimGenesisRevenue([tokenIds])` for BNB

**Mainnet Action**:
- Frontend already implements separate currency display
- No changes needed for mainnet

---

### Issue 5: Incomplete Statistics Display
**Problem**: Missing treasury and burned amounts in global stats.

**Root Cause**:
- Only displaying 4 metrics (audits, minted, distributed, genesis revenue)
- Not reading `totalTreasury` and `totalBurned` from contract

**Solution**:
- Expanded to 6 metrics display:
  1. Total Audits (totalJobs)
  2. Total SSTL Minted (totalJobs * 67)
  3. Total Distributed (totalDistributed - 60% to NFT holders)
  4. Total Treasury (totalTreasury - 20%)
  5. Total Burned (totalBurned - 10%)
  6. Total Genesis Revenue (totalGenesisRevenue - in BNB)
- Synchronized both `sidebarMyRewards.tsx` and `sidebarGeneralStats.tsx`

**Mainnet Action**:
- Frontend already displays all 6 metrics
- No changes needed for mainnet

---

### Summary of Testnet Fixes Applied
1. ✅ Gateway redeployed 3 times to fix role hashes and NFT iteration
2. ✅ Frontend updated to use `writeContract` with proper parameters
3. ✅ UI refactored to separate SSTL and BNB displays
4. ✅ Two separate claim buttons implemented
5. ✅ Global stats expanded to 6 comprehensive metrics
6. ✅ All contract state variables verified and documented

**Result**: Fully functional testnet deployment with successful AI Audit execution (tx: `0x96c0b4ed...`)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    SMARTSENTINELS ECOSYSTEM                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  SmartSentinelsToken (SSTL) - DEPLOYED & VERIFIED               │
│  • mintPoUW(address to, uint256 amount)                         │
│  • Only callable by addresses with MCP_OPERATOR_ROLE            │
│  • DO NOT MODIFY - Already on BSCScan                           │
└──────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┴───────────────┐
                ▼                               ▼
┌──────────────────────────────┐   ┌──────────────────────────────┐
│  SmartSentinelsPoUW          │   │  AIAuditAgentGateway         │
│  (Distribution & Claims)     │◄──│  (Payment & Job Handler)     │
└──────────────────────────────┘   └──────────────────────────────┘
        │ Tracks rewards                  │ Receives payment
        │ Handles claiming                │ Triggers distribution
        │ Gets MCP_OPERATOR_ROLE          │ Calls PoUW contract
        │                                 │
        ▼                                 ▼
┌──────────────────────────────┐   ┌──────────────────────────────┐
│ SmartSentinelsAIAuditNFT     │   │  SmartSentinelsGenesis       │
│ (Reward NFT Collection)      │   │  (10% NFT Revenue + Boost)   │
└──────────────────────────────┘   └──────────────────────────────┘

FUTURE EXPANSION (Modular):
┌──────────────────────────────┐   ┌──────────────────────────────┐
│  MedicalAgentGateway         │   │  LegalAgentGateway           │
│  (New Agent Type)            │   │  (New Agent Type)            │
└──────────────────────────────┘   └──────────────────────────────┘
        │                                 │
        ▼                                 ▼
┌──────────────────────────────┐   ┌──────────────────────────────┐
│ SmartSentinelsMedicalNFT     │   │ SmartSentinelsLegalNFT       │
└──────────────────────────────┘   └──────────────────────────────┘
```

---

## Core Components

### 1. SmartSentinelsToken (SSTL) ✅ Already Deployed

**Status**: Deployed and verified on BSC - **DO NOT MODIFY**

**Role**: BEP-20 token with PoUW minting capability

**Key Functions**:
- `mintPoUW(address to, uint256 amount)` - Only callable by `MCP_OPERATOR_ROLE`

**Who Gets MCP_OPERATOR_ROLE**:
- ✅ AIAuditAgentGateway contract (for minting to treasury/owner/burn/PoUW)

---

### 2. SmartSentinelsGenesis ✅ DEPLOYED

**Status**: Deployed on BSC Testnet
**Address**: `0x51e3F92f65A4CFB43b923215053f87E43B98F5B2`

**Purpose**: Premium NFT collection with special benefits

**Benefits for Holders**:
- 10% revenue share from ALL future NFT collection sales (AI Audit, Medical, Legal, etc.)
- 100% staking yield boost (future feature)
- Revenue distributed as **BNB** (not SSTL tokens)

**How Genesis Revenue Works**:
1. User mints AI Audit NFT for 0.074 BNB
2. AI Audit contract splits payment:
   - **51% → Owner** (0x46e451d555ebCB4ccE5087555a07F6e69D017b05)
   - **15% → David** (0xb792F3217bA6C35ED8670d48fc3aFB60Ad7d7356)
   - **10% → Darius** (0x9b2310b2043FD59bB1070016d1D02C976b46b0E1)
   - **10% → Mariana** (0x72fCEd35A613186Bf50A63c9fc2415b0Af0ACf94)
   - **2% → Codex** (0x8D17d02c2E75aAB802CB4978bF0ec1251aAD511d)
   - **2% → Nadskie** (0x861e3Aef66B042387F32E7Fe6887f24E3cc0D16b)
   - **10% → PoUW Contract** (for Genesis holders)
3. Genesis holders claim their BNB share via `claimGenesisRevenue()`

**NOT Part of PoUW Mining**: Genesis holders don't receive mining rewards from agent jobs (they get NFT sale revenue instead)

---

### 3. SmartSentinelsAIAuditNFT ✅ DEPLOYED

**Status**: Deployed on BSC Testnet
**Address**: `0x5d481fc291e07DEed888cfdC2503f5b941bf1F72`

**Purpose**: NFT collection tied to the AI Audit Agent

**Benefits for Holders**:
- Receive 60% of PoUW rewards when AI Audit jobs are completed
- Rewards distributed proportionally to number of NFTs owned

**Requirements**:
- Must be ERC721Enumerable (for holder iteration) ✅
- Registered with SmartSentinelsPoUW contract

**Payee Structure** (Updated for Genesis Revenue):
After PoUW deployment, this contract will have 7 payees splitting 100% of mint revenue:
- **Owner** (0x46e451d555ebCB4ccE5087555a07F6e69D017b05): **51%** (reduced from 61%)
- **David** (0xb792F3217bA6C35ED8670d48fc3aFB60Ad7d7356): **15%**
- **Darius** (0x9b2310b2043FD59bB1070016d1D02C976b46b0E1): **10%**
- **Mariana** (0x72fCEd35A613186Bf50A63c9fc2415b0Af0ACf94): **10%**
- **Codex** (0x8D17d02c2E75aAB802CB4978bF0ec1251aAD511d): **2%**
- **Nadskie** (0x861e3Aef66B042387F32E7Fe6887f24E3cc0D16b): **2%**
- **PoUW Contract** (for Genesis holders): **10%** ← Added after PoUW deployment

**Total**: 100%

**Constructor Arguments Used**:
```solidity
initBaseURI: "https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafkreifjhcmcs7z2abcfxxjvzov7uo52gt77zzg5sm2afkgmltgvgljpfi"
initContractURI: "https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafkreigqgaftcbindkqivwul6jx5xy55b5qdvjos4mvxbzj4mtysvhwqsi"
initMediaBaseURI: "https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafybeidamro3q34rfekck2w7bh5vskhkxpado6fcoeamglhmrgd4ervn6i"
initPaymentToken: 0x25A48743cE22d68500763b4556026a8863C07555
```

---

### 4. SmartSentinelsPoUW (NEW - Core Distribution Contract)

**Purpose**: Central hub for reward tracking, distribution, and claiming

**Key Responsibilities**:
1. **Track pending rewards** for each user individually across all agent types
2. **Allow users to claim** their own rewards in 1 transaction (each user claims separately)
3. **Manage registered NFT collections** (AI Audit, Medical, Legal, etc.)
4. **Track total distributions** across all collections

**Key Features**:
- **Individual claiming**: Each user claims only THEIR OWN pending rewards
- **Single transaction per user**: One user claiming doesn't affect others
- **Claim when ready**: Users decide when to claim (gas-efficient, no rush)
- **Multi-collection support**: If a user has NFTs from multiple agents, they claim all at once
- **Modular**: Supports unlimited NFT collections
- **Has `MCP_OPERATOR_ROLE`**: To mint tokens when users claim

**Example**:
- User A has 120.6 SSTL pending → Claims → Receives 120.6 SSTL
- User B has 347 SSTL pending → Claims later → Receives 347 SSTL
- Users claim independently, whenever they want

**Constructor Arguments**:
```solidity
constructor(
    address _sstlToken,      // SmartSentinelsToken address
    address _treasuryWallet  // Treasury wallet address
)
```

---

### 5. AIAuditAgentGateway (NEW - Payment & Job Handler)

**Purpose**: Handles payments for AI Audit services and triggers reward distribution

**Key Responsibilities**:
1. **Accept payments** (BNB or SSTL) from users requesting audits
2. **Calculate reward distribution** (67 SSTL per job)
3. **Mint tokens directly** to treasury (20%), burn (10%), service owner (10%)
4. **Call SmartSentinelsPoUW** to allocate NFT holder rewards (60%)

**Flow Per Job**:
```
User pays 0.1 BNB → Gateway receives payment → Gateway mints 67 SSTL:
  ├─ Mints 13.4 SSTL directly to treasury
  ├─ Mints 6.7 SSTL directly to burn address
  ├─ Mints 6.7 SSTL directly to service owner
  └─ Calls PoUW.allocateRewards() with 40.2 SSTL for NFT holders
      (NFT holders claim later via PoUW contract)
```

**Constructor Arguments**:
```solidity
constructor(
    address _sstlToken,          // SmartSentinelsToken address
    address _sstlPaymentToken,   // SmartSentinelsToken address (same, for payments)
    address _nftCollection,      // SmartSentinelsAIAuditNFT address
    address _pouwContract,       // SmartSentinelsPoUW address
    address _serviceOwner,       // Your wallet (receives payments + 10% rewards)
    address _treasuryWallet      // Treasury wallet (receives 20% rewards)
)
```

**Roles Needed**:
- Must have `MCP_OPERATOR_ROLE` on SmartSentinelsToken (to mint)
- Must have `GATEWAY_ROLE` on SmartSentinelsPoUW (to allocate rewards)

---

### 6. Future Agent Gateways (Medical, Legal, etc.)

**Same pattern as AIAuditAgentGateway**:
- Each new agent type gets its own gateway contract
- Each gateway linked to its own NFT collection
- All gateways call the same SmartSentinelsPoUW contract
- Users claim all rewards together from PoUW

---

## Tokenomics Per Job (67 SSTL)

| Recipient | % | Amount | Method |
|-----------|---|--------|--------|
| **NFT Holders** | 60% | 40.2 SSTL | Allocated to PoUW Manager (claimable) |
| **Treasury** | 20% | 13.4 SSTL | Minted directly to treasury wallet |
| **Burn** | 10% | 6.7 SSTL | Minted to gateway → burned immediately |
| **Service Owner** | 10% | 6.7 SSTL | Minted directly to agent operator |

---

## Contract Relationships & Data Flow

### How Everything Connects:

```
┌─────────────────────────────────────────────────────────────────┐
│  USER REQUESTS AUDIT                                             │
└────────────────────────┬─────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  AIAuditAgentGateway.payAndRunAudit()                           │
│  • Receives payment (BNB/SSTL)                                  │
│  • Sends payment to service owner                               │
└────────────────────────┬─────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  GATEWAY DISTRIBUTES 67 SSTL REWARDS                            │
│                                                                  │
│  1. Calls sstlToken.mintPoUW(treasury, 13.4)    [20%]          │
│  2. Calls sstlToken.mintPoUW(burnAddr, 6.7)     [10%]          │
│  3. Calls sstlToken.mintPoUW(serviceOwner, 6.7) [10%]          │
│  4. Calls pouwContract.allocateRewards(...)     [60% = 40.2]   │
└────────────────────────┬─────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  SmartSentinelsPoUW.allocateRewards()                           │
│  • Receives holder addresses and amounts                        │
│  • Updates pendingRewards[holder][nftCollection] += amount     │
│  • Does NOT mint yet (waits for user to claim)                 │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ (Later, when user wants to claim)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  USER CLAIMS REWARDS                                             │
│  SmartSentinelsPoUW.claimAllRewards()                           │
│  • Reads all pending rewards for user                           │
│  • Calls sstlToken.mintPoUW(user, totalPending)                │
│  • Resets pendingRewards to 0                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Constructor Arguments Chain:

```
1. SmartSentinelsToken
   constructor() // No arguments - already deployed

2. SmartSentinelsGenesis
   constructor(baseURI, contractURI, mediaURI, sstlTokenAddress)

3. SmartSentinelsAIAuditNFT
   constructor(baseURI, contractURI, mediaURI, sstlTokenAddress)

4. SmartSentinelsPoUW
   constructor(
       sstlTokenAddress,     // From step 1
       treasuryWallet        // Your treasury address
   )

5. AIAuditAgentGateway
   constructor(
       sstlTokenAddress,     // From step 1
       sstlTokenAddress,     // Same (for payments)
       auditNFTAddress,      // From step 3
       pouwContractAddress,  // From step 4
       serviceOwnerAddress,  // Your operational wallet
       treasuryWallet        // Same as step 4
   )
```

### Role Grants Required:

```
After deployment, execute these transactions:

1. SmartSentinelsToken.grantRole(
       MCP_OPERATOR_ROLE,
       pouwContractAddress
   )
   → Allows SmartSentinelsPoUW to mint when users claim

2. SmartSentinelsToken.grantRole(
       MCP_OPERATOR_ROLE,
       auditGatewayAddress
   )
   → Allows AIAuditAgentGateway to mint treasury/burn/owner shares

3. SmartSentinelsPoUW.grantRole(
       GATEWAY_ROLE,
       auditGatewayAddress
   )
   → Allows AIAuditAgentGateway to allocate rewards

4. SmartSentinelsPoUW.registerCollection(
       auditNFTAddress
   )
   → Registers AI Audit NFT collection for rewards
```

---

## Detailed Architecture

### Contract 1: SmartSentinelsPoUW.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";

interface ISSTLToken {
    function mintPoUW(address to, uint256 amount) external;
}

contract SmartSentinelsPoUW is AccessControl, ReentrancyGuard {
    bytes32 public constant GATEWAY_ROLE = keccak256("GATEWAY_ROLE");
    
    ISSTLToken public immutable sstlToken;
    address public treasuryWallet;
    
    // User pending rewards per NFT collection
    mapping(address => mapping(address => uint256)) public pendingRewards;
    
    // Total rewards distributed per collection
    mapping(address => uint256) public totalDistributedByCollection;
    
    // Track registered NFT collections
    address[] public registeredCollections;
    mapping(address => bool) public isRegisteredCollection;
    
    // Events
    event RewardsAllocated(address indexed collection, uint256 totalAmount);
    event RewardsClaimed(address indexed user, address indexed collection, uint256 amount);
    event BatchRewardsClaimed(address indexed user, uint256 totalAmount);
    event CollectionRegistered(address indexed collection);
    
    constructor(address _sstlToken, address _treasuryWallet) {
        sstlToken = ISSTLToken(_sstlToken);
        treasuryWallet = _treasuryWallet;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    /**
     * @notice Called by agent gateways to allocate rewards to NFT holders
     * @param nftCollection The NFT collection address
     * @param holders Array of NFT holder addresses
     * @param amounts Array of reward amounts per holder
     */
    function allocateRewards(
        address nftCollection,
        address[] calldata holders,
        uint256[] calldata amounts
    ) external onlyRole(GATEWAY_ROLE) {
        require(holders.length == amounts.length, "Length mismatch");
        require(isRegisteredCollection[nftCollection], "Collection not registered");
        
        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < holders.length; i++) {
            pendingRewards[holders[i]][nftCollection] += amounts[i];
            totalAmount += amounts[i];
        }
        
        totalDistributedByCollection[nftCollection] += totalAmount;
        emit RewardsAllocated(nftCollection, totalAmount);
    }
    
    /**
     * @notice User claims all pending rewards from ALL collections
     */
    function claimAllRewards() external nonReentrant {
        uint256 totalClaim = 0;
        
        for (uint256 i = 0; i < registeredCollections.length; i++) {
            address collection = registeredCollections[i];
            uint256 pending = pendingRewards[msg.sender][collection];
            
            if (pending > 0) {
                pendingRewards[msg.sender][collection] = 0;
                totalClaim += pending;
                emit RewardsClaimed(msg.sender, collection, pending);
            }
        }
        
        require(totalClaim > 0, "No rewards to claim");
        sstlToken.mintPoUW(msg.sender, totalClaim);
        emit BatchRewardsClaimed(msg.sender, totalClaim);
    }
    
    /**
     * @notice User claims rewards from a specific collection
     */
    function claimRewards(address nftCollection) external nonReentrant {
        uint256 pending = pendingRewards[msg.sender][nftCollection];
        require(pending > 0, "No rewards to claim");
        
        pendingRewards[msg.sender][nftCollection] = 0;
        sstlToken.mintPoUW(msg.sender, pending);
        emit RewardsClaimed(msg.sender, nftCollection, pending);
    }
    
    /**
     * @notice Get total pending rewards for a user across all collections
     */
    function getPendingRewards(address user) external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < registeredCollections.length; i++) {
            total += pendingRewards[user][registeredCollections[i]];
        }
        return total;
    }
    
    /**
     * @notice Get pending rewards breakdown by collection
     */
    function getPendingRewardsByCollection(address user) 
        external 
        view 
        returns (address[] memory collections, uint256[] memory amounts) 
    {
        collections = new address[](registeredCollections.length);
        amounts = new uint256[](registeredCollections.length);
        
        for (uint256 i = 0; i < registeredCollections.length; i++) {
            collections[i] = registeredCollections[i];
            amounts[i] = pendingRewards[user][registeredCollections[i]];
        }
    }
    
    /**
     * @notice Register a new NFT collection for rewards
     */
    function registerCollection(address collection) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!isRegisteredCollection[collection], "Already registered");
        isRegisteredCollection[collection] = true;
        registeredCollections.push(collection);
        emit CollectionRegistered(collection);
    }
    
    /**
     * @notice Update treasury wallet
     */
    function updateTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        treasuryWallet = newTreasury;
    }
}
```

---

### Contract 2: AIAuditAgentGateway.sol (Updated)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface ISSTLToken {
    function mintPoUW(address to, uint256 amount) external;
}

interface ISmartSentinelsPoUW {
    function allocateRewards(
        address nftCollection,
        address[] calldata holders,
        uint256[] calldata amounts
    ) external;
}

contract AIAuditAgentGateway is AccessControl, ReentrancyGuard {
    bytes32 public constant MCP_OPERATOR_ROLE = keccak256("MCP_OPERATOR_ROLE");
    
    ISSTLToken public sstlToken;
    IERC20 public sstlPaymentToken;
    IERC721Enumerable public nftCollection;
    ISmartSentinelsPoUW public pouwContract;
    
    address public serviceOwner;
    address public treasuryWallet;
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    bool public useNativePayment = true;
    uint256 public servicePriceBNB = 0.1 ether;
    uint256 public servicePriceSSTL = 1000 * 10**18;
    
    uint256 public constant REWARD_PER_JOB = 67 * 10**18;
    uint256 public constant NFT_SHARE_PERCENT = 60;
    uint256 public constant TREASURY_PERCENT = 20;
    uint256 public constant BURN_PERCENT = 10;
    uint256 public constant OWNER_PERCENT = 10;
    
    uint256 public totalJobsCompleted;
    
    event JobCompleted(uint256 indexed jobId, address indexed user, uint256 payment);
    event RewardsDistributed(uint256 jobId, uint256 nftShare, uint256 treasury, uint256 burned, uint256 owner);
    
    constructor(
        address _sstlToken,
        address _sstlPaymentToken,
        address _nftCollection,
        address _pouwContract,
        address _serviceOwner,
        address _treasuryWallet
    ) {
        sstlToken = ISSTLToken(_sstlToken);
        sstlPaymentToken = IERC20(_sstlPaymentToken);
        nftCollection = IERC721Enumerable(_nftCollection);
        pouwContract = ISmartSentinelsPoUW(_pouwContract);
        serviceOwner = _serviceOwner;
        treasuryWallet = _treasuryWallet;
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }
    
    function payAndRunAudit() external payable nonReentrant {
        // Handle payment
        if (useNativePayment) {
            require(msg.value == servicePriceBNB, "Incorrect BNB");
            (bool sent, ) = payable(serviceOwner).call{value: msg.value}("");
            require(sent, "Transfer failed");
        } else {
            require(msg.value == 0, "Don't send BNB");
            require(
                sstlPaymentToken.transferFrom(msg.sender, serviceOwner, servicePriceSSTL),
                "Payment failed"
            );
        }
        
        totalJobsCompleted++;
        emit JobCompleted(totalJobsCompleted, msg.sender, useNativePayment ? msg.value : servicePriceSSTL);
        
        // Distribute rewards
        _distributeRewards();
    }
    
    function _distributeRewards() internal {
        uint256 nftShare = (REWARD_PER_JOB * NFT_SHARE_PERCENT) / 100;     // 40.2 SSTL
        uint256 treasuryShare = (REWARD_PER_JOB * TREASURY_PERCENT) / 100; // 13.4 SSTL
        uint256 burnShare = (REWARD_PER_JOB * BURN_PERCENT) / 100;         // 6.7 SSTL
        uint256 ownerShare = (REWARD_PER_JOB * OWNER_PERCENT) / 100;       // 6.7 SSTL
        
        // 1. Allocate NFT holder rewards via PoUW Manager
        _allocateNFTRewards(nftShare);
        
        // 2. Mint to treasury
        sstlToken.mintPoUW(treasuryWallet, treasuryShare);
        
        // 3. Mint and burn
        sstlToken.mintPoUW(BURN_ADDRESS, burnShare);
        
        // 4. Mint to service owner
        sstlToken.mintPoUW(serviceOwner, ownerShare);
        
        emit RewardsDistributed(totalJobsCompleted, nftShare, treasuryShare, burnShare, ownerShare);
    }
    
    function _allocateNFTRewards(uint256 totalAmount) internal {
        uint256 supply = nftCollection.totalSupply();
        require(supply > 0, "No NFT holders");
        
        uint256 rewardPerNFT = totalAmount / supply;
        
        // Get unique holders and their balances
        (address[] memory holders, uint256[] memory amounts) = _getHoldersAndAmounts(rewardPerNFT);
        
        // Allocate via PoUW contract
        pouwContract.allocateRewards(address(nftCollection), holders, amounts);
    }
    
    function _getHoldersAndAmounts(uint256 rewardPerNFT) 
        internal 
        view 
        returns (address[] memory holders, uint256[] memory amounts) 
    {
        uint256 supply = nftCollection.totalSupply();
        address[] memory tempHolders = new address[](supply);
        uint256[] memory tempAmounts = new uint256[](supply);
        uint256 uniqueCount = 0;
        
        for (uint256 i = 0; i < supply; i++) {
            address holder = nftCollection.ownerOf(i);
            
            // Check if holder already in list
            bool found = false;
            for (uint256 j = 0; j < uniqueCount; j++) {
                if (tempHolders[j] == holder) {
                    tempAmounts[j] += rewardPerNFT;
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                tempHolders[uniqueCount] = holder;
                tempAmounts[uniqueCount] = rewardPerNFT;
                uniqueCount++;
            }
        }
        
        // Create final arrays
        holders = new address[](uniqueCount);
        amounts = new uint256[](uniqueCount);
        for (uint256 i = 0; i < uniqueCount; i++) {
            holders[i] = tempHolders[i];
            amounts[i] = tempAmounts[i];
        }
    }
    
    // Admin functions...
    function setPaymentMode(bool native) external onlyRole(DEFAULT_ADMIN_ROLE) {
        useNativePayment = native;
    }
    
    function updatePrices(uint256 bnb, uint256 sstl) external onlyRole(DEFAULT_ADMIN_ROLE) {
        servicePriceBNB = bnb;
        servicePriceSSTL = sstl;
    }
    
    receive() external payable {}
}
```

---

## Deployment Steps

### TESTNET DEPLOYMENT TRACKER

**✅ Deployed Contracts**:
1. ✅ **SmartSentinelsToken**: `0x25A48743cE22d68500763b4556026a8863C07555`
2. ✅ **SmartSentinelsGenesis**: `0x51e3F92f65A4CFB43b923215053f87E43B98F5B2`
3. ✅ **SmartSentinelsAIAuditNFT**: `0x5d481fc291e07DEed888cfdC2503f5b941bf1F72`

**⏳ Next to Deploy**:
4. ⏳ **SmartSentinelsPoUW**: Ready to deploy with correct wallet addresses ✅
5. ⏳ **AIAuditAgentGateway**: Create contract file, then deploy

---

### Wallet Addresses Reference

**Service Owner & Admin**: `0x46e451d555ebCB4ccE5087555a07F6e69D017b05`

**AI Audit NFT Payees** (After PoUW deployment - will be updated):
- Owner: `0x46e451d555ebCB4ccE5087555a07F6e69D017b05` - 51% (reduced from 61%)
- David: `0xb792F3217bA6C35ED8670d48fc3aFB60Ad7d7356` - 15%
- Darius: `0x9b2310b2043FD59bB1070016d1D02C976b46b0E1` - 10%
- Mariana: `0x72fCEd35A613186Bf50A63c9fc2415b0Af0ACf94` - 10%
- Codex: `0x8D17d02c2E75aAB802CB4978bF0ec1251aAD511d` - 2%
- Nadskie: `0x861e3Aef66B042387F32E7Fe6887f24E3cc0D16b` - 2%
- PoUW Contract: [To be deployed] - 10% (for Genesis holders)

---

### Phase 1: Deploy Core Infrastructure

**Prerequisites**: SmartSentinelsToken already deployed at `0x25A48743cE22d68500763b4556026a8863C07555` ✅

**STEP 1**: ✅ **COMPLETE** - SmartSentinelsToken deployed

**STEP 2**: ✅ **COMPLETE** - SmartSentinelsGenesis deployed at `0x51e3F92f65A4CFB43b923215053f87E43B98F5B2`

**STEP 3**: ✅ **COMPLETE** - SmartSentinelsAIAuditNFT deployed at `0x5d481fc291e07DEed888cfdC2503f5b941bf1F72`

**STEP 4**: ⏳ **Deploy SmartSentinelsPoUW**
   ```solidity
   constructor(
       address _sstlToken,          // 0x25A48743cE22d68500763b4556026a8863C07555
       address _genesisCollection,  // 0x51e3F92f65A4CFB43b923215053f87E43B98F5B2
       address _treasuryWallet,     // Your treasury wallet address (for staking)
       address _serviceOwner,       // 0x46e451d555ebCB4ccE5087555a07F6e69D017b05 (receives 10%)
       address admin                // 0x46e451d555ebCB4ccE5087555a07F6e69D017b05 (same as service owner)
   )
   ```
   - Save address as: `POUW_CONTRACT_ADDRESS`
   - Save address as: `POUW_CONTRACT_ADDRESS`

**STEP 5**: ⚠️ **CRITICAL: Update AI Audit NFT Payees for Genesis Revenue**
   ```javascript
   // Connect to AI Audit NFT: 0x5d481fc291e07DEed888cfdC2503f5b941bf1F72
   const aiAuditNFT = await ethers.getContractAt(
       "SmartSentinelsAIAudit",
       "0x5d481fc291e07DEed888cfdC2503f5b941bf1F72"
   );

   // Update Owner (you) share from 61% to 51% (giving up 10% for Genesis holders)
   await aiAuditNFT.addOrUpdatePayee("0x46e451d555ebCB4ccE5087555a07F6e69D017b05", 5100, true);

   // Add PoUW contract as 7th payee with 10% share
   // This 10% will be distributed to Genesis holders
   await aiAuditNFT.addOrUpdatePayee(POUW_CONTRACT_ADDRESS, 1000, true);

   // Verify total shares = 10000 (100%)
   // New distribution:
   // - Owner (0x46e451d555ebCB4ccE5087555a07F6e69D017b05): 51%
   // - David (0xb792F3217bA6C35ED8670d48fc3aFB60Ad7d7356): 15%
   // - Darius (0x9b2310b2043FD59bB1070016d1D02C976b46b0E1): 10%
   // - Mariana (0x72fCEd35A613186Bf50A63c9fc2415b0Af0ACf94): 10%
   // - Codex (0x8D17d02c2E75aAB802CB4978bF0ec1251aAD511d): 2%
   // - Nadskie (0x861e3Aef66B042387F32E7Fe6887f24E3cc0D16b): 2%
   // - PoUW (Genesis holders): 10%
   // TOTAL: 100%
   ```

**STEP 6**: ⏳ **Grant MCP_OPERATOR_ROLE to SmartSentinelsPoUW**
   ```javascript
   await sstlToken.grantRole(
       MCP_OPERATOR_ROLE, 
       POUW_CONTRACT_ADDRESS
   );
   ```

### Phase 2: Deploy First Agent (AI Audit)

**STEP 7**: ⏳ **Register AI Audit NFT Collection with SmartSentinelsPoUW**
   ```javascript
   await pouw.registerCollection(AI_AUDIT_NFT_ADDRESS);  // 0x5d481fc291e07DEed888cfdC2503f5b941bf1F72
   ```

**STEP 8**: ⏳ **Deploy AIAuditAgentGateway**
   ```javascript
   const gateway = await deploy("AIAuditAgentGateway", [
       SSTL_TOKEN_ADDRESS,      // 0x25A48743cE22d68500763b4556026a8863C07555
       SSTL_TOKEN_ADDRESS,      // 0x25A48743cE22d68500763b4556026a8863C07555 (same)
       AI_AUDIT_NFT_ADDRESS,    // From STEP 3
       POUW_CONTRACT_ADDRESS,   // From STEP 4
       SERVICE_OWNER_ADDRESS,   // Your operational wallet
       TREASURY_WALLET_ADDRESS  // Treasury (same as PoUW constructor)
   ]);
   
   // Save: AI_AUDIT_GATEWAY_ADDRESS
   ```

**STEP 8**: ⏳ **Grant GATEWAY_ROLE to AIAuditAgentGateway**
   ```javascript
   await pouw.grantRole(GATEWAY_ROLE, AI_AUDIT_GATEWAY_ADDRESS);
   ```

**STEP 9**: ⏳ **Grant MCP_OPERATOR_ROLE to AIAuditAgentGateway**
   ```javascript
   await sstlToken.grantRole(
       MCP_OPERATOR_ROLE, 
       AI_AUDIT_GATEWAY_ADDRESS
   );
   ```

### Phase 3: Add More Agents (Future)

For each new agent type:

1. Deploy new NFT collection (e.g., SmartSentinelsMedicalNFT)
2. Register with `pouw.registerCollection(newNFTAddress)`
3. Deploy new gateway (e.g., MedicalAgentGateway)
4. Grant GATEWAY_ROLE: `pouw.grantRole(GATEWAY_ROLE, newGatewayAddress)`
5. Grant MCP_OPERATOR_ROLE: `sstlToken.grantRole(MCP_OPERATOR_ROLE, newGatewayAddress)`

---

## User Experience (Claiming Rewards)

### Scenario: User Owns NFTs from Multiple Collections

**User Portfolio**:
- 2x AI Audit NFTs
- 1x Medical NFT
- 3x Legal NFTs

**After Multiple Jobs**:
- Pending from AI Audit: 120.6 SSTL
- Pending from Medical: 45.3 SSTL
- Pending from Legal: 347.8 SSTL
- **Total Pending: 513.7 SSTL**

**Claiming**:

**Option 1: Claim All (1 Transaction)**
```javascript
rewardManager.claimAllRewards();
// User receives 513.7 SSTL in 1 transaction
```

**Option 2: Claim from Specific Collection**
```javascript
rewardManager.claimRewards(AI_AUDIT_NFT_ADDRESS);
// User receives 120.6 SSTL
```

---

## Frontend Integration (My Rewards Component)

### Display Pending Rewards

```javascript
// Get total pending rewards across all collections
const totalPending = await pouw.getPendingRewards(userAddress);

// Get breakdown by collection
const [collections, amounts] = await pouw.getPendingRewardsByCollection(userAddress);

// Display in "My Rewards" component
collections.forEach((collection, i) => {
    if (amounts[i] > 0) {
        console.log(`${getCollectionName(collection)}: ${ethers.utils.formatEther(amounts[i])} SSTL`);
    }
});
```

### Claim All Button

```javascript
async function claimAllRewards() {
    try {
        const tx = await pouw.claimAllRewards();
        await tx.wait();
        // Show success notification
        alert('Successfully claimed all rewards!');
    } catch (error) {
        console.error('Claim failed:', error);
    }
}
```

### Claim from Specific Collection

```javascript
async function claimFromAuditAgent() {
    const tx = await pouw.claimRewards(AI_AUDIT_NFT_ADDRESS);
    await tx.wait();
}
```

---

## Role Management Summary

### SmartSentinelsToken Roles
- `DEFAULT_ADMIN_ROLE`: Token deployer (you) - already set
- `MCP_OPERATOR_ROLE`: 
  - **SmartSentinelsPoUW** (for user claims)
  - **AIAuditAgentGateway** (for treasury/burn/owner mints)
  - Future agent gateways

### SmartSentinelsPoUW Roles
- `DEFAULT_ADMIN_ROLE`: Deployer (you)
- `GATEWAY_ROLE`: 
  - **AIAuditAgentGateway** (to allocate NFT rewards)
  - Future agent gateways

### AIAuditAgentGateway Roles
- `DEFAULT_ADMIN_ROLE`: Deployer (you)
- `MCP_OPERATOR_ROLE`: MCP Server (for automation) - optional

---

## Security Checklist

- [ ] Only authorized gateways can allocate rewards
- [ ] Users can only claim their own rewards
- [ ] Reentrancy protection on all claim functions
- [ ] NFT collection verification before registration
- [ ] Treasury and service owner addresses updatable
- [ ] Role management follows principle of least privilege

---

## Scalability Benefits

✅ **Add unlimited agents** - Just deploy new gateway + NFT collection
✅ **Users claim once** - All rewards from all collections in 1 TX
✅ **Gas efficient** - Rewards tracked off-chain until claim
✅ **No migration** - Token contract stays unchanged
✅ **Flexible** - Each agent can have different tokenomics if needed

---

## Post-Deployment Configuration Steps

**⚠️ CRITICAL: Follow this exact order when deploying to mainnet!**

### Deployment Order
1. ✅ Deploy SmartSentinelsToken
2. ✅ Deploy SmartSentinelsGenesis
3. ✅ Deploy SmartSentinelsAIAuditNFT
4. ✅ Deploy SmartSentinelsPoUW
5. ✅ Deploy AIAuditAgentGateway

### Configuration Steps (Execute in this order!)

#### Step 1: Grant MCP_OPERATOR_ROLE to Gateway on Token Contract
- **Who executes:** Token admin
- **Contract:** SmartSentinelsToken
- **Function:** `grantRole(bytes32 role, address account)`
- **Parameters:**
  - `role`: `0xb2b79e21bd6877b2d65bf60cc9e0674084ef1b390eab9bf4621eaeb12d01f1c2` (MCP_OPERATOR_ROLE - this is the actual hash used in deployed contracts)
  - `account`: `<GATEWAY_ADDRESS>` (from deployment)
- **How to get role hash:** Call `MCP_OPERATOR_ROLE()` on Token contract
- **Status:** ✅ COMPLETED (Testnet) | ⏳ PENDING (Mainnet)

#### Step 2: Grant GATEWAY_ROLE to Gateway on PoUW Contract
- **Who executes:** PoUW admin
- **Contract:** SmartSentinelsPoUW
- **Function:** `grantRole(bytes32 role, address account)`
- **Parameters:**
  - `role`: `0xb90e9995c6170fff8ea03e9ad6919878e483770c237f1a6f330ceaa7112b344a` (GATEWAY_ROLE - this is the actual hash used in deployed contracts)
  - `account`: `<GATEWAY_ADDRESS>` (from deployment)
- **How to get role hash:** Call `GATEWAY_ROLE()` on PoUW contract
- **Status:** ✅ COMPLETED (Testnet) | ⏳ PENDING (Mainnet)

#### Step 3: Register AI Audit NFT Collection with PoUW
- **Who executes:** PoUW admin
- **Contract:** SmartSentinelsPoUW
- **Function:** `registerCollection(address nftCollection)`
- **Parameters:**
  - `nftCollection`: `<AI_AUDIT_NFT_ADDRESS>`
- **Status:** ✅ COMPLETED (Testnet) | ⏳ PENDING (Mainnet)

#### Step 4: Reduce Owner Share on AI Audit NFT (61% → 51%)
- **Who executes:** AI Audit NFT owner (deployer)
- **Contract:** SmartSentinelsAIAuditNFT
- **Function:** `addOrUpdatePayee(address payee, uint256 share, bool active)`
- **Parameters:**
  - `payee`: `<OWNER_WALLET>`
  - `share`: `5100` (51%)
  - `active`: `true`
- **⚠️ IMPORTANT:** Do this BEFORE adding PoUW as payee!
- **Status:** ✅ COMPLETED (Testnet) | ⏳ PENDING (Mainnet)

#### Step 5: Add PoUW as Payee to AI Audit NFT (10% for Genesis holders)
- **Who executes:** AI Audit NFT owner (deployer)
- **Contract:** SmartSentinelsAIAuditNFT
- **Function:** `addOrUpdatePayee(address payee, uint256 share, bool active)`
- **Parameters:**
  - `payee`: `<POUW_ADDRESS>` (PoUW contract)
  - `share`: `1000` (10%)
  - `active`: `true`
- **Result:** Genesis holders now receive 10% of AI Audit NFT mint revenue in BNB
- **Status:** ✅ COMPLETED (Testnet) | ⏳ PENDING (Mainnet)

#### Step 6: Configure Gateway Payment Settings
- **Who executes:** Gateway admin
- **Contract:** AIAuditAgentGateway
- **Function:** `setPaymentConfig(uint256 bnbAmount, uint256 tokenAmount, bool _acceptBNB, bool _acceptToken)`
- **Testnet Parameters:**
  - `bnbAmount`: `100000000000000000` (0.1 BNB)
  - `tokenAmount`: `1000000000000000000000` (1000 SSTL)
  - `_acceptBNB`: `true`
  - `_acceptToken`: `false` (BNB-only mode for testing)
- **Mainnet Parameters:** Adjust as needed
- **Status:** ✅ COMPLETED (Testnet) | ⏳ PENDING (Mainnet)

---

## Critical Implementation Details (Learned from Testnet)

### Role Hashes
**⚠️ IMPORTANT:** The deployed contracts use custom role name hashes, NOT standard keccak256 hashes!

- **MCP_OPERATOR_ROLE**: `0xb2b79e21bd6877b2d65bf60cc9e0674084ef1b390eab9bf4621eaeb12d01f1c2`
  - This is what the Token contract actually uses
  - Always verify by calling `MCP_OPERATOR_ROLE()` on the contract
  
- **GATEWAY_ROLE**: `0xb90e9995c6170fff8ea03e9ad6919878e483770c237f1a6f330ceaa7112b344a`
  - This is what the PoUW contract actually uses
  - Always verify by calling `GATEWAY_ROLE()` on the contract

### NFT Token ID Schema
**⚠️ CRITICAL:** Both Genesis and AI Audit NFTs start from tokenId 1, NOT 0!

- When iterating NFTs, use `IERC721Enumerable.tokenByIndex(i)` to get actual token IDs
- DO NOT use `ownerOf(i)` directly as it will fail for tokenId 0
- Gateway contract was fixed to use correct iteration method

### Frontend Contract Integration

#### PoUW Contract Functions Used:
```solidity
// User reward queries
function getTotalPendingRewards(address user) external view returns (uint256)
function getTotalPendingGenesisRevenue(address user) external view returns (uint256)

// Claiming functions
function claimAllRewards() external
function batchClaimGenesisRevenue(uint256[] calldata genesisTokenIds) external

// Global statistics
function totalJobs() external view returns (uint256)
function totalDistributed() external view returns (uint256)
function totalTreasury() external view returns (uint256)
function totalBurned() external view returns (uint256)
function totalGenesisRevenue() external view returns (uint256)
```

#### Gateway Contract Functions Used:
```solidity
// Payment and execution (frontend calls this)
function payAndRunAuditBNB(string calldata txHash) external payable

// Admin functions
function setPaymentConfig(uint256 bnbAmount, uint256 tokenAmount, bool _acceptBNB, bool _acceptToken) external
```

### Reward Distribution Breakdown
Per AI Audit Job (67 SSTL total):
- **60% (40.2 SSTL)** → Distributed to NFT holders (tracked in PoUW)
- **20% (13.4 SSTL)** → Treasury wallet (minted directly by Gateway)
- **10% (6.7 SSTL)** → Service owner wallet (minted directly by Gateway)
- **10% (6.7 SSTL)** → Burned (sent to 0x000...dead by Gateway)

Genesis Revenue:
- **10% of AI Audit NFT mint revenue** (in BNB) → Distributed to Genesis holders
- Genesis holders claim using `batchClaimGenesisRevenue(tokenIds[])`

### Verified Transaction Flow (Testnet)
1. ✅ Genesis NFT minted (tx: `0xea72c0f56600c1c660c6c2e58d9769f23c65118aaaf3bdda98a9370a9d9a6c24`)
2. ✅ AI Audit NFT minted (tx: `0x33243cf2d42168c46bf031353fa76b90a3741390d333becdcb149777d2e83847`)
3. ✅ AI Audit executed successfully (tx: `0x96c0b4ed5294b5684a2307b5d566d7cb9c5ab2f562a77c63be4f8e9a0b47a9a5`)
   - 40.2 SSTL transferred to PoUW contract
   - 13.4 SSTL transferred to Treasury
   - 6.7 SSTL transferred to Burn address
   - 6.7 SSTL transferred to Service Owner
4. ⏳ User can now claim 40.2 SSTL rewards + 0.0074 BNB Genesis revenue

---

## Testnet Deployment Summary (BSC Testnet)

### Deployed Contracts
- ✅ **SmartSentinelsToken**: `0x25A48743cE22d68500763b4556026a8863C07555`
- ✅ **SmartSentinelsGenesis**: `0x51e3F92f65A4CFB43b923215053f87E43B98F5B2`
- ✅ **SmartSentinelsAIAuditNFT**: `0x5d481fc291e07DEed888cfdC2503f5b941bf1F72`
- ✅ **SmartSentinelsPoUW**: `0x15fBce4D325939b3C1A4719D67DE0AC94fC0088e`
- ✅ **AIAuditAgentGateway**: `0x86Ae29DC53350E2049a09D9167e0181273A03E3B`

### Configuration Status
- ✅ MCP_OPERATOR_ROLE granted to Gateway on Token
- ✅ GATEWAY_ROLE granted to Gateway on PoUW
- ✅ AI Audit NFT registered with PoUW
- ✅ Owner share reduced to 51%
- ✅ PoUW added as 7th payee (10% for Genesis holders)
- ✅ Gateway payment config set

### Final AI Audit NFT Payee Structure
- **Owner** (0x4E21F74143660ee576F4D2aC26BD30729a849f55): 51%
- **David** (0xb792F3217bA6C35ED8670d48fc3aFB60Ad7d7356): 15%
- **Darius** (0x9b2310b2043FD59bB1070016d1D02C976b46b0E1): 10%
- **Mariana** (0x72fCEd35A613186Bf50A63c9fc2415b0Af0ACf94): 10%
- **PoUW/Genesis** (0x15fBce4D325939b3C1A4719D67DE0AC94fC0088e): 10%
- **Codex** (0x8D17d02c2E75aAB802CB4978bF0ec1251aAD511d): 2%
- **Nadskie** (0x861e3Aef66B042387F32E7Fe6887f24E3cc0D16b): 2%
- **Total**: 100%

---

## Testing Checklist

### Deployment Tests (BSC Testnet)
- [x] SmartSentinelsToken deployed ✅ (`0x25A48743cE22d68500763b4556026a8863C07555`)
- [x] SmartSentinelsGenesis deployed ✅ (`0x51e3F92f65A4CFB43b923215053f87E43B98F5B2`)
- [x] SmartSentinelsAIAuditNFT deployed ✅ (`0x5d481fc291e07DEed888cfdC2503f5b941bf1F72`)
- [x] SmartSentinelsPoUW deployed ✅ (`0x15fBce4D325939b3C1A4719D67DE0AC94fC0088e`)
- [x] AIAuditAgentGateway deployed ✅ (`0x859B9A1942f22ebc420886E649C34bEaC4149FBa` - 3rd deployment with tokenByIndex fix)

### Configuration Tests (BSC Testnet)
- [x] MCP_OPERATOR_ROLE granted to Gateway ✅ (hash: `0xb2b79e21bd6877b2d65bf60cc9e0674084ef1b390eab9bf4621eaeb12d01f1c2`)
- [x] GATEWAY_ROLE granted to Gateway ✅ (hash: `0xb90e9995c6170fff8ea03e9ad6919878e483770c237f1a6f330ceaa7112b344a`)
- [x] AI Audit NFT registered with PoUW ✅
- [x] Owner share reduced to 51% on AI Audit NFT ✅
- [x] PoUW added as payee (10%) to AI Audit NFT ✅
- [x] Payment config set on Gateway ✅ (0.1 BNB, BNB-only mode)

### Minting Tests (BSC Testnet)
- [x] Mint Genesis NFT ✅ (tx: `0xea72c0f56600c1c660c6c2e58d9769f23c65118aaaf3bdda98a9370a9d9a6c24`)
- [x] Mint AI Audit NFT ✅ (tx: `0x33243cf2d42168c46bf031353fa76b90a3741390d333becdcb149777d2e83847`)

### AI Audit Execution Tests (BSC Testnet)
- [x] Run `gateway.payAndRunAuditBNB(txHash)` successfully ✅
  - Transaction: `0x96c0b4ed5294b5684a2307b5d566d7cb9c5ab2f562a77c63be4f8e9a0b47a9a5`
  - Payment: 0.1 BNB
  - SSTL Distribution Verified:
    - [x] 40.2 SSTL (60%) → PoUW contract ✅
    - [x] 13.4 SSTL (20%) → Treasury wallet ✅
    - [x] 6.7 SSTL (10%) → Service owner wallet ✅
    - [x] 6.7 SSTL (10%) → Burn address (0x000...dead) ✅
- [x] Genesis revenue allocation ✅ (0.0074 BNB from 10% of 0.074 BNB mint fee)

### Reward Query Tests (BSC Testnet)
- [x] `pouw.getTotalPendingRewards(user)` returns correct SSTL amount ✅ (40.2 SSTL)
- [x] `pouw.getTotalPendingGenesisRevenue(user)` returns correct BNB amount ✅ (0.0074 BNB)
- [x] `pouw.totalJobs()` returns correct count ✅ (1)
- [x] `pouw.totalDistributed()` returns correct amount ✅ (40.2 SSTL)
- [x] `pouw.totalTreasury()` returns correct amount ✅ (13.4 SSTL)
- [x] `pouw.totalBurned()` returns correct amount ✅ (6.7 SSTL)
- [x] `pouw.totalGenesisRevenue()` returns correct amount ✅ (0.0074 BNB)

### Frontend Display Tests (BSC Testnet)
- [x] Rewards dashboard displays correct pending amounts ✅
  - [x] Shows "40.2000 SSTL + 0.0074 BNB" (separate currencies) ✅
  - [x] Removed incorrect "Total Earned" aggregation ✅
- [x] Global statistics show all 6 metrics ✅:
  - [x] Total Audits: 1 ✅
  - [x] Total SSTL Minted: 67.00 SSTL ✅
  - [x] Total Distributed: 40.20 SSTL (60%) ✅
  - [x] Total Treasury: 13.40 SSTL (20%) ✅
  - [x] Total Burned: 6.70 SSTL (10%) ✅
  - [x] Total Genesis Revenue: 0.0074 BNB ✅
- [x] General Stats component synchronized ✅
- [x] Two separate claim buttons (SSTL and BNB) ✅
- [x] Claim buttons responsive and properly sized ✅

### Pending Claim Tests (To be tested)
- [ ] Call `pouw.claimAllRewards()` as AI Audit NFT holder (claim 40.2 SSTL)
- [ ] Verify SSTL balance increased correctly
- [ ] Call `pouw.batchClaimGenesisRevenue([1])` as Genesis holder (claim 0.0074 BNB)
- [ ] Verify BNB balance increased correctly
- [ ] Test multiple job executions and reward accumulation
- [ ] Test with multiple NFT holders scenario
- [ ] Test halving mechanism after 365 days

---

## Mainnet Deployment Guide

### What Changes for Mainnet
**Only these values change:**
- Chain ID: `97` (BSC Testnet) → `56` (BSC Mainnet)
- Contract addresses: Deploy fresh contracts on mainnet
- RPC endpoints: Update frontend to use mainnet RPCs
- Payment amounts: Adjust `setPaymentConfig()` as needed (currently 0.1 BNB testnet)

**Everything else stays identical:**
- Constructor parameters (same structure, just new mainnet addresses)
- Role grant procedures (same role hash values, same order)
- Configuration steps (follow exact same order as testnet)
- Frontend code (only update contract addresses in `src/contracts/index.ts`)

### Mainnet Deployment Checklist
1. [ ] Deploy all 5 contracts on BSC Mainnet (Chain ID 56)
2. [ ] Update `src/contracts/index.ts` with new mainnet addresses
3. [ ] Execute configuration steps 1-6 (same order as testnet)
4. [ ] Verify all role grants with correct hashes
5. [ ] Mint test NFTs and execute test audit
6. [ ] Verify SSTL distribution matches testnet ratios
7. [ ] Test claim functions work correctly
8. [ ] Monitor first production jobs for issues

### Critical Reminders for Mainnet
- ⚠️ Use exact role hash values: `0xb2b79e21...` (MCP_OPERATOR_ROLE) and `0xb90e9995...` (GATEWAY_ROLE)
- ⚠️ Gateway must use `tokenByIndex()` for NFT iteration (already implemented)
- ⚠️ Configure PoUW as 10% payee AFTER reducing owner share to 51%
- ⚠️ Frontend must use separate claim buttons for SSTL and BNB (already implemented)
- ⚠️ Verify all 6 stats display correctly before launch

---

---

## Future Enhancements

1. **Staking Integration**
   - Genesis holders get 100% yield boost
   - Modify reward allocation to include staking multipliers

2. **Halving Mechanism**
   - Implement time-based or milestone-based halving
   - Reduce `REWARD_PER_JOB` over time

3. **Dynamic Reward Rates**
   - Different agents can have different reward amounts
   - Allow governance to adjust rates

4. **Referral System**
   - Users who refer clients get bonus rewards
   - Track referrals in gateway

---

## Summary

This architecture provides:

1. **Uses Your Existing Contracts**: 
   - ✅ SmartSentinelsToken (deployed & verified)
   - ✅ SmartSentinelsGenesis (for revenue sharing)
   - ✅ SmartSentinelsAIAuditNFT (for PoUW rewards)

2. **New Contracts Needed**:
   - **SmartSentinelsPoUW**: Central reward tracking and claiming
   - **AIAuditAgentGateway**: Payment handler for AI Audit jobs

3. **Modular Design**: Add unlimited agents by deploying new gateway + NFT collection

4. **Single Transaction Claims**: Users claim all rewards from all agents in 1 TX via SmartSentinelsPoUW

5. **Gas Efficient**: Rewards tracked off-chain style (pending balances), minted only when claimed

6. **Clear Separation**:
   - **Gateway**: Handles payments, calculates distribution, mints direct shares (treasury/burn/owner)
   - **SmartSentinelsPoUW**: Tracks NFT holder rewards, handles claiming, mints on claim

The SmartSentinelsPoUW contract is the central hub where all NFT holders go to claim their rewards, regardless of which agent generated them.

---

**Next Steps**:
1. ✅ Review this updated architecture
2. Deploy SmartSentinelsPoUW to testnet
3. Deploy AIAuditAgentGateway to testnet  
4. Test full flow with real NFTs
5. Audit contracts
6. Deploy to mainnet
