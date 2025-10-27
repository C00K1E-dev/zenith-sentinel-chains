// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SmartSentinels Proof of Useful Work Pool (Upgradable Fix)
 * @author Gemini / Andrei
 * @notice Handles SSTL distribution to any registered AI Agent NFT holders (1x share) + Genesis NFT revenue share.
 * @dev This version supports adding unlimited future NFT collections and makes the Genesis collection address mutable.
 */
contract SmartSentinelsPoUW is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // -----------------------------------------
    // Roles
    // -----------------------------------------
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // -----------------------------------------
    // Immutable References & Dynamic Registry
    // -----------------------------------------
    IERC20 public immutable sstlToken;
    // Genesis collection is now MUTABLE (removed 'immutable') to allow address updates
    IERC721Enumerable public genesisCollection; 
    
    // Dynamic registry for all NFT collections eligible for PoUW rewards
    mapping(address => bool) public isRewardCollection;
    address[] private rewardCollectionList;

    // -----------------------------------------
    // Wallets
    // -----------------------------------------
    address public treasuryWallet;
    address public constant burnWallet = 0x000000000000000000000000000000000000dEaD;

    // -----------------------------------------
    // Reward Tracking
    // -----------------------------------------
    uint256 public totalNFTRewards; 
    mapping(uint256 => uint256) public claimedPerNFT; 

    uint256 public totalRevenue;
    mapping(uint256 => uint256) public claimedRevenuePerGenesisNFT; 

    uint256 public totalJobs;
    uint256 public totalMinted;

    // -----------------------------------------
    // Config (percentages)
    // -----------------------------------------
    uint256 public nftSharePercent = 60;
    uint256 public treasurySharePercent = 20; 
    uint256 public burnSharePercent = 10;
    uint256 public clientSharePercent = 10; 

    // -----------------------------------------
    // Halving (time-based)
    // -----------------------------------------
    uint256 public halvingInterval = 365 days;
    uint256 public lastHalvingTime;
    uint256 public halvingCount;
    event HalvingApplied(uint256 newHalvingCount, uint256 timestamp);
    event HalvingIntervalUpdated(uint256 oldInterval, uint256 newInterval);
    event RewardCollectionAdded(address indexed collection);
    event RewardCollectionRemoved(address indexed collection);
    event GenesisCollectionUpdated(address oldAddress, address newAddress);

    // -----------------------------------------
    // Events & Constructor
    // -----------------------------------------
    event RewardsDistributed(
        uint256 totalAmount,
        uint256 nftShareBeforeHalving,
        uint256 nftShareAfterHalving,
        uint256 treasuryShare,
        uint256 burnShare,
        uint256 clientShare
    );
    event RewardClaimed(address indexed user, uint256 tokenId, uint256 amount);
    event BatchRewardsClaimed(address indexed user, uint256[] tokenIds, uint256 totalAmount);
    event RevenueClaimed(address indexed user, uint256 tokenId, uint256 amount);
    event BatchRevenueClaimed(address indexed user, uint256[] tokenIds, uint256 totalAmount);
    event TreasuryUpdated(address oldWallet, address newWallet);

    constructor(
        address _sstlToken,
        address _nftCollection, // Initial AI Audit NFT
        address _genesisCollection,
        address _treasuryWallet,
        address admin
    ) {
        require(
            _sstlToken != address(0) &&
            _nftCollection != address(0) &&
            _genesisCollection != address(0) &&
            _treasuryWallet != address(0),
            "Zero address"
        );
        require(_nftCollection != _genesisCollection, "Collections must differ");

        sstlToken = IERC20(_sstlToken);
        genesisCollection = IERC721Enumerable(_genesisCollection);
        treasuryWallet = _treasuryWallet;
        lastHalvingTime = block.timestamp;
        halvingCount = 0;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        grantRole(ADMIN_ROLE, admin);
        
        // Register the initial AI Audit NFT collection immediately
        _addRewardCollection(_nftCollection);
    }

    // -----------------------------------------
    // Halving helpers
    // -----------------------------------------

    function _applyHalvingIfNeeded() internal {
        if (block.timestamp < lastHalvingTime + halvingInterval) {
            return;
        }
        uint256 intervals = (block.timestamp - lastHalvingTime) / halvingInterval;
        halvingCount += intervals;
        lastHalvingTime = lastHalvingTime + intervals * halvingInterval;
        emit HalvingApplied(halvingCount, block.timestamp);
    }

    function _applyHalvingToAmount(uint256 amount) public view returns (uint256) {
        if (halvingCount == 0) return amount;
        uint256 divisor = 1;
        for (uint256 i = 0; i < halvingCount; i++) {
            divisor = divisor * 2;
             if (divisor > amount && i + 1 < halvingCount) {
                 // Optimization: if divisor already exceeds amount, the result will be 0.
             }
        }
        return amount / divisor;
    }

    function setHalvingInterval(uint256 newInterval) external onlyRole(ADMIN_ROLE) {
        require(newInterval > 0, "Interval > 0");
        emit HalvingIntervalUpdated(halvingInterval, newInterval);
        halvingInterval = newInterval;
    }

    // -----------------------------------------
    // REWARD SHARE LOGIC (DYNAMIC)
    // -----------------------------------------

    /// @notice Calculates the total effective share count for rewards (SUMS ALL REGISTERED COLLECTIONS).
    function _getTotalRewardShareSupply() public view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < rewardCollectionList.length; i++) {
            // All reward NFTs are counted as 1x share
            address collectionAddress = rewardCollectionList[i];
            // Use try/catch to safely call external totalSupply, skipping if the collection is invalid/burned
            try IERC721Enumerable(collectionAddress).totalSupply() returns (uint256 supply) {
                total += supply;
            } catch {}
        }
        return total;
    }
    
    /// @notice Helper to check ownership in ANY registered PoUW collection.
    function _isPoUWOwner(uint256 tokenId, address user) internal view returns (bool) {
        for (uint256 i = 0; i < rewardCollectionList.length; i++) {
            address collectionAddress = rewardCollectionList[i];
            // Use try/catch to safely call external ownerOf, skipping if the token is non-existent
            try IERC721Enumerable(collectionAddress).ownerOf(tokenId) returns (address owner) {
                if (owner == user) {
                    return true;
                }
            } catch {}
        }
        return false;
    }

    // -----------------------------------------
    // ADMIN: DYNAMIC COLLECTION MANAGEMENT
    // -----------------------------------------
    
    function _addRewardCollection(address collection) internal {
        require(collection != address(0), "Zero address");
        require(!isRewardCollection[collection], "Collection already registered");
        
        // Ensure the collection is not the Genesis collection (PoUW reward segregation)
        require(collection != address(genesisCollection), "Cannot register Genesis for PoUW rewards");
        
        isRewardCollection[collection] = true;
        rewardCollectionList.push(collection);
        emit RewardCollectionAdded(collection);
    }

    function addRewardCollection(address collection) external onlyRole(ADMIN_ROLE) {
        _addRewardCollection(collection);
    }

    function removeRewardCollection(address collection) external onlyRole(ADMIN_ROLE) {
        require(isRewardCollection[collection], "Collection not registered");
        isRewardCollection[collection] = false;
        
        // Remove from the list (using swap-and-pop for gas efficiency)
        for (uint256 i = 0; i < rewardCollectionList.length; i++) {
            if (rewardCollectionList[i] == collection) {
                rewardCollectionList[i] = rewardCollectionList[rewardCollectionList.length - 1];
                rewardCollectionList.pop();
                break;
            }
        }
        emit RewardCollectionRemoved(collection);
    }

    function getRewardCollectionList() external view returns (address[] memory) {
        return rewardCollectionList;
    }

    /// @notice Admin function to update the Genesis Collection address (now mutable).
    function setGenesisCollection(address newCollection) external onlyRole(ADMIN_ROLE) {
        require(newCollection != address(0), "Zero address");
        address oldAddress = address(genesisCollection);
        genesisCollection = IERC721Enumerable(newCollection);
        emit GenesisCollectionUpdated(oldAddress, newCollection);
    }

    // -----------------------------------------
    // VIEW FUNCTIONS (PENDING REWARDS/REVENUE)
    // -----------------------------------------

    /// @notice Calculates the SSTL rewards available to claim for a specific NFT (checks any registered PoUW NFT).
    function pendingReward(uint256 tokenId) public view returns (uint256) {
        // We assume the caller checks PoUW eligibility *before* calling this function, 
        // but we rely on _isPoUWOwner for final confirmation.
        if (!_isPoUWOwner(tokenId, msg.sender)) {
            return 0; 
        }

        uint256 totalRewardShares = _getTotalRewardShareSupply();
        if (totalRewardShares == 0) return 0;

        uint256 rewardPerShare = totalNFTRewards / totalRewardShares;
        uint256 totalEligible = rewardPerShare; // 1x share for all PoUW NFTs
        
        uint256 claimed = claimedPerNFT[tokenId];

        if (totalEligible > claimed) {
            return totalEligible - claimed;
        } else {
            return 0;
        }
    }

    /// @notice Calculates the SSTL revenue available to claim for a specific Genesis NFT.
    function pendingRevenue(uint256 tokenId) public view returns (uint256) {
        // Ownership Check: Check the current (mutable) Genesis collection address
        try genesisCollection.ownerOf(tokenId) returns (address owner) {
            if (owner != msg.sender) return 0;
        } catch {
            return 0; // Not a valid Genesis NFT ID or ownership check failed
        }

        uint256 totalGenesis = genesisCollection.totalSupply();
        if (totalGenesis == 0) return 0;
        
        uint256 perNFT = totalRevenue / totalGenesis;
        uint256 claimed = claimedRevenuePerGenesisNFT[tokenId];

        if (perNFT > claimed) {
            return perNFT - claimed;
        } else {
            return 0;
        }
    }

    // -----------------------------------------
    // Reward Distribution 
    // -----------------------------------------

    function distributeRewards(uint256 totalAmount) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(totalAmount > 0, "Invalid amount");

        _applyHalvingIfNeeded();

        uint256 nftShareRaw = (totalAmount * nftSharePercent) / 100;
        uint256 treasuryShare = (totalAmount * treasurySharePercent) / 100;
        uint256 burnShare = (totalAmount * burnSharePercent) / 100;
        uint256 clientShare = totalAmount - nftShareRaw - treasuryShare - burnShare;

        uint256 nftShareAfterHalving = _applyHalvingToAmount(nftShareRaw);

        totalMinted += totalAmount;
        totalNFTRewards += nftShareAfterHalving;

        if (treasuryShare > 0) sstlToken.safeTransfer(treasuryWallet, treasuryShare);
        if (burnShare > 0) sstlToken.safeTransfer(burnWallet, burnShare);
        
        if (clientShare > 0) {
            // In this flow, msg.sender will be the AIAuditAgentGateway, so clientShare goes back there.
            sstlToken.safeTransfer(msg.sender, clientShare);
        }

        unchecked { totalJobs += 1; }

        emit RewardsDistributed(totalAmount, nftShareRaw, nftShareAfterHalving, treasuryShare, burnShare, clientShare);
    }

    // -----------------------------------------
    // Claiming Logic for NFT Holders 
    // -----------------------------------------

    function claimReward(uint256 tokenId) public nonReentrant {
        address ownerAddress = msg.sender;
        
        // Ownership Check: Revert if not owned by sender in an eligible PoUW collection
        require(_isPoUWOwner(tokenId, ownerAddress), "NFT not owned or not eligible for PoUW reward"); 

        uint256 totalRewardShares = _getTotalRewardShareSupply();
        require(totalRewardShares > 0, "No shares");

        uint256 rewardPerShare = totalNFTRewards / totalRewardShares;
        uint256 totalEligible = rewardPerShare; // 1x share for all PoUW NFTs
        
        uint256 claimed = claimedPerNFT[tokenId];
        require(totalEligible > claimed, "Nothing to claim");

        uint256 claimable = totalEligible - claimed;
        claimedPerNFT[tokenId] = totalEligible;

        sstlToken.safeTransfer(ownerAddress, claimable);
        emit RewardClaimed(ownerAddress, tokenId, claimable);
    }

    function batchClaimRewards(uint256[] calldata tokenIds) external nonReentrant {
        uint256 totalClaim;
        uint256 totalRewardShares = _getTotalRewardShareSupply();
        require(totalRewardShares > 0, "No shares");
        uint256 rewardPerShare = totalNFTRewards / totalRewardShares; 
        
        uint256 totalEligible = rewardPerShare;

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            
            // Skip if token is not owned by sender in an eligible PoUW collection
            if (!_isPoUWOwner(tokenId, msg.sender)) { 
                continue; 
            }
            
            uint256 claimed = claimedPerNFT[tokenId];
            
            if (totalEligible > claimed) {
                uint256 claimable = totalEligible - claimed;
                claimedPerNFT[tokenId] = totalEligible;
                totalClaim += claimable;
            }
        }

        require(totalClaim > 0, "Nothing to claim");
        sstlToken.safeTransfer(msg.sender, totalClaim);
        emit BatchRewardsClaimed(msg.sender, tokenIds, totalClaim);
    }
    
    // -----------------------------------------
    // Genesis NFT Revenue Sharing (UPDATED for Mutability)
    // -----------------------------------------

    function addRevenue(uint256 amount) external onlyRole(ADMIN_ROLE) {
        require(amount > 0, "Invalid amount");
        // Caller (Admin) must first approve this contract to spend their SSTL tokens
        sstlToken.safeTransferFrom(msg.sender, address(this), amount); 
        totalRevenue += amount;
    }

    function claimRevenue(uint256 tokenId) public nonReentrant {
        // Ownership Check: Use the current (mutable) genesisCollection reference
        require(genesisCollection.ownerOf(tokenId) == msg.sender, "Not owner");

        uint256 totalGenesis = genesisCollection.totalSupply();
        require(totalGenesis > 0, "No Genesis NFTs");

        uint256 perNFT = totalRevenue / totalGenesis;
        uint256 claimed = claimedRevenuePerGenesisNFT[tokenId];
        require(perNFT > claimed, "Nothing to claim");

        uint256 claimable = perNFT - claimed;
        claimedRevenuePerGenesisNFT[tokenId] = perNFT;

        sstlToken.safeTransfer(msg.sender, claimable);
        emit RevenueClaimed(msg.sender, tokenId, claimable);
    }

    function batchClaimRevenue(uint256[] calldata tokenIds) external nonReentrant {
        uint256 totalClaim;
        uint256 totalGenesis = genesisCollection.totalSupply();
        require(totalGenesis > 0, "No Genesis NFTs");

        uint256 perNFT = totalRevenue / totalGenesis;

        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(genesisCollection.ownerOf(tokenIds[i]) == msg.sender, "Not owner");
            uint256 claimed = claimedRevenuePerGenesisNFT[tokenIds[i]];
            if (perNFT > claimed) {
                uint256 claimable = perNFT - claimed;
                claimedRevenuePerGenesisNFT[tokenIds[i]] = perNFT;
                totalClaim += claimable;
            }
        }

        require(totalClaim > 0, "Nothing to claim");
        sstlToken.safeTransfer(msg.sender, totalClaim);
        emit BatchRevenueClaimed(msg.sender, tokenIds, totalClaim);
    }

    // -----------------------------------------
    // Admin Configuration (Standard)
    // -----------------------------------------

    function setTreasuryWallet(address newWallet) external onlyRole(ADMIN_ROLE) {
        require(newWallet != address(0), "Zero address");
        address old = treasuryWallet;
        treasuryWallet = newWallet;
        emit TreasuryUpdated(old, newWallet);
    }

    function updateShares(
        uint256 _nftShare,
        uint256 _treasuryShare,
        uint256 _burnShare,
        uint256 _clientShare
    ) external onlyRole(ADMIN_ROLE) {
        require(
            _nftShare + _treasuryShare + _burnShare + _clientShare == 100,
            "Invalid percentages"
        );
        nftSharePercent = _nftShare;
        treasurySharePercent = _treasuryShare;
        burnSharePercent = _burnShare;
        clientSharePercent = _clientShare;
    }

    function manualHalve() external onlyRole(ADMIN_ROLE) {
        halvingCount += 1;
        lastHalvingTime = block.timestamp;
        emit HalvingApplied(halvingCount, block.timestamp);
    }

    receive() external payable {}
}
