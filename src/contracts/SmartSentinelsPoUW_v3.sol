// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SmartSentinels Proof of Useful Work Distribution Contract
 * @author Andrei / Gemini / SmartSentinels AI
 * @notice Central hub for PoUW reward tracking, claiming, and Genesis revenue distribution
 * @dev Supports unlimited AI agents, each with their own NFT collection and gateway
 *      Gateway contracts mint tokens and allocate rewards to this contract
 *      Users claim rewards in 1 transaction (PoUW rewards + Genesis revenue)
 *      Halving logic is handled by Gateway contracts
 */
contract SmartSentinelsPoUW is AccessControl, ReentrancyGuard {

    // -----------------------------------------
    // Roles
    // -----------------------------------------
    bytes32 public constant GATEWAY_ROLE = keccak256("GATEWAY_ROLE");

    // -----------------------------------------
    // State Variables (All with explicit visibility)
    // -----------------------------------------
    IERC20 public immutable sstlToken;
    IERC721Enumerable public genesisCollection;
    address public treasuryWallet;
    address public serviceOwner;
    address public immutable burnAddress;

    // -----------------------------------------
    // NFT Collection Registry (For PoUW Rewards)
    // -----------------------------------------
    mapping(address => bool) public isRegisteredCollection;
    address[] public registeredCollections;

    // -----------------------------------------
    // User Pending Rewards Tracking (Per User Per Collection)
    // -----------------------------------------
    // user => collection => pending SSTL amount
    mapping(address => mapping(address => uint256)) public pendingRewards;

    // -----------------------------------------
    // Genesis Revenue Tracking (10% from NFT Sales)
    // -----------------------------------------
    uint256 public totalGenesisRevenue;
    uint256 public totalGenesisRevenueClaimed;
    mapping(uint256 => uint256) public claimedGenesisRevenue; // DEPRECATED - kept for frontend compatibility
    
    // Snapshot-Based Revenue Tracking (Fixes retroactive claim vulnerability)
    uint256 public revenuePerNFTAccumulator; // Cumulative revenue per NFT over time
    mapping(uint256 => uint256) public genesisNFTDebt; // Revenue snapshot at mint time (tokenId => accumulated revenue when minted)

    // -----------------------------------------
    // Statistics Tracking
    // -----------------------------------------
    uint256 public totalJobs;
    uint256 public totalDistributed;
    uint256 public totalTreasury;
    uint256 public totalBurned;
    uint256 public totalServiceOwner;
    
    // Per-collection statistics
    mapping(address => uint256) public totalDistributedByCollection;

    // -----------------------------------------
    // Events
    // -----------------------------------------
    event CollectionRegistered(address indexed collection);
    event CollectionRemoved(address indexed collection);
    event RewardsAllocated(
        address indexed collection,
        uint256 indexed jobNumber,
        uint256 totalAmount
    );
    event RewardsClaimed(
        address indexed user,
        address indexed collection,
        uint256 amount
    );
    event AllRewardsClaimed(
        address indexed user,
        uint256 totalAmount
    );
    event GenesisRevenueAdded(
        uint256 amount,
        uint256 totalRevenue
    );
    event GenesisRevenueClaimed(
        address indexed user,
        uint256 indexed tokenId,
        uint256 amount
    );
    event BatchGenesisRevenueClaimed(
        address indexed user,
        uint256[] tokenIds,
        uint256 totalAmount
    );
    event GenesisDustCollected(
        address indexed treasury,
        uint256 amount
    );
    event JobCompleted(
        uint256 indexed jobNumber,
        uint256 totalMinted,
        uint256 nftShare,
        uint256 treasuryShare,
        uint256 burnShare,
        uint256 serviceOwnerShare
    );
    event TreasuryUpdated(
        address indexed oldWallet,
        address indexed newWallet
    );
    event ServiceOwnerUpdated(
        address indexed oldOwner,
        address indexed newOwner
    );
    event GenesisCollectionUpdated(
        address indexed oldCollection,
        address indexed newCollection
    );

    // -----------------------------------------
    // Constructor
    // -----------------------------------------
    /**
     * @notice Initializes the PoUW contract
     * @dev Sets up roles, token references, and burn address
     * @param _sstlToken SSTL token contract address
     * @param _genesisCollection Genesis NFT collection address
     * @param _treasuryWallet Treasury wallet address
     * @param _serviceOwner Service owner wallet address
     * @param _burnAddress Burn address for tokens
     * @param admin Admin wallet address
     */
    constructor(
        address _sstlToken,
        address _genesisCollection,
        address _treasuryWallet,
        address _serviceOwner,
        address _burnAddress,
        address admin
    ) {
        require(_sstlToken != address(0), "Invalid token");
        // Note: _genesisCollection can be address(0) initially, set later via setGenesisCollection
        require(_treasuryWallet != address(0), "Invalid treasury");
        require(_serviceOwner != address(0), "Invalid service owner");
        require(_burnAddress != address(0), "Invalid burn address");
        require(admin != address(0), "Invalid admin");

        sstlToken = IERC20(_sstlToken);
        genesisCollection = IERC721Enumerable(_genesisCollection);
        treasuryWallet = _treasuryWallet;
        serviceOwner = _serviceOwner;
        burnAddress = _burnAddress;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(GATEWAY_ROLE, admin);
    }

    // -----------------------------------------
    // Collection Management (Admin Only)
    // -----------------------------------------

    /**
     * @notice Register a new NFT collection for PoUW rewards
     * @param collection Address of the NFT collection contract
     */
    function registerCollection(address collection) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(collection != address(0), "Invalid collection");
        require(!isRegisteredCollection[collection], "Already registered");
        
        isRegisteredCollection[collection] = true;
        registeredCollections.push(collection);
        
        emit CollectionRegistered(collection);
    }

    /**
     * @notice Remove a collection from the registry
     * @param collection Address of the NFT collection to remove
     */
    function removeCollection(address collection) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(isRegisteredCollection[collection], "Not registered");
        
        isRegisteredCollection[collection] = false;
        
        // Cached array length for gas optimization
        uint256 length = registeredCollections.length;
        for (uint256 i; i < length; ) {
            if (registeredCollections[i] == collection) {
                registeredCollections[i] = registeredCollections[length - 1];
                registeredCollections.pop();
                break;
            }
            unchecked { ++i; }
        }
        
        emit CollectionRemoved(collection);
    }

    /**
     * @notice Get all registered collections
     */
    function getRegisteredCollections() external view returns (address[] memory) {
        return registeredCollections;
    }

    /**
     * @notice Update treasury wallet address
     */
    function setTreasuryWallet(address _newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newTreasury != address(0), "Invalid address");
        require(_newTreasury != treasuryWallet, "Same address");
        address oldWallet = treasuryWallet;
        treasuryWallet = _newTreasury;
        emit TreasuryUpdated(oldWallet, _newTreasury);
    }

    /**
     * @notice Update service owner address
     */
    function setServiceOwner(address _newOwner) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newOwner != address(0), "Invalid address");
        require(_newOwner != serviceOwner, "Same address");
        address oldOwner = serviceOwner;
        serviceOwner = _newOwner;
        emit ServiceOwnerUpdated(oldOwner, _newOwner);
    }

    /**
     * @notice Update Genesis collection address
     */
    function setGenesisCollection(address _newGenesis) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newGenesis != address(0), "Invalid address");
        require(_newGenesis != address(genesisCollection), "Same address");
        address oldCollection = address(genesisCollection);
        genesisCollection = IERC721Enumerable(_newGenesis);
        emit GenesisCollectionUpdated(oldCollection, _newGenesis);
    }

    /**
     * @notice Register a newly minted Genesis NFT with current revenue snapshot
     * @param tokenId The Genesis NFT token ID that was just minted
     * @dev : Called by Genesis NFT contract on mint to set debt snapshot
     *      This prevents new NFTs from claiming revenue generated before their mint
     *      Only the Genesis collection contract can call this
     */
    function onGenesisNFTMinted(uint256 tokenId) external {
        require(msg.sender == address(genesisCollection), "Only Genesis contract");
        
        // Set debt to current accumulator - this NFT can only claim revenue AFTER this point
        genesisNFTDebt[tokenId] = revenuePerNFTAccumulator;
    }

    // -----------------------------------------
    // PoUW Reward Allocation (Gateway Only)
    // -----------------------------------------

    /**
     * @notice Allocate PoUW rewards for a specific collection (called by Gateway)
     * @param collection NFT collection address
     * @param totalReward Total SSTL tokens allocated to this job
     * @param jobNumber Sequential job number for tracking
     */
    function allocateRewards(
        address collection,
        uint256 totalReward,
        uint256 jobNumber
    ) external onlyRole(GATEWAY_ROLE) {
        require(isRegisteredCollection[collection], "Collection not registered");
        require(totalReward != 0, "No rewards");
        
        IERC721Enumerable nftCollection = IERC721Enumerable(collection);
        uint256 totalNFTs = nftCollection.totalSupply();
        require(totalNFTs != 0, "No NFTs minted");
        
        // Calculate per-NFT reward share
        uint256 rewardPerNFT = totalReward / totalNFTs;
        require(rewardPerNFT != 0, "Reward too small");
        
        // Cached array length for gas optimization
        // Distribute rewards to all current NFT holders
        for (uint256 i; i < totalNFTs; ) {
            uint256 tokenId = nftCollection.tokenByIndex(i);
            address owner = nftCollection.ownerOf(tokenId);
            pendingRewards[owner][collection] += rewardPerNFT;
            unchecked { ++i; }
        }
        
        // Update statistics
        unchecked {
            ++totalJobs;
            totalDistributed += totalReward;
            totalDistributedByCollection[collection] += totalReward;
        }
        
        emit RewardsAllocated(collection, jobNumber, totalReward);
    }

    /**
     * @notice Gateway calls this to log job completion statistics
     * @dev This is informational only - actual token minting happens in Gateway
     */
    function recordJobCompletion(
        uint256 jobNumber,
        uint256 totalMinted,
        uint256 nftShare,
        uint256 treasuryShare,
        uint256 burnShare,
        uint256 serviceOwnerShare
    ) external onlyRole(GATEWAY_ROLE) {
        unchecked {
            totalTreasury += treasuryShare;
            totalBurned += burnShare;
            totalServiceOwner += serviceOwnerShare;
        }
        
        emit JobCompleted(
            jobNumber,
            totalMinted,
            nftShare,
            treasuryShare,
            burnShare,
            serviceOwnerShare
        );
    }

    // -----------------------------------------
    // PoUW Reward Claiming (Users)
    // -----------------------------------------

    /**
     * @notice Claim pending rewards for a specific collection
     * @param collection NFT collection address
     */
    function claimRewards(address collection) external nonReentrant {
        require(isRegisteredCollection[collection], "Invalid collection");
        
        uint256 pending = pendingRewards[msg.sender][collection];
        require(pending != 0, "No rewards");
        
        delete pendingRewards[msg.sender][collection];
        
        // Check return value of transfer
        bool success = sstlToken.transfer(msg.sender, pending);
        require(success, "Transfer failed");
        
        emit RewardsClaimed(msg.sender, collection, pending);
    }

    /**
     * @notice Claim ALL pending rewards from ALL collections in 1 transaction
     * @dev This is the main user-facing claim function
     */
    function claimAllRewards() external nonReentrant {
        uint256 totalClaim;
        
        // Cached array length for gas optimization
        uint256 length = registeredCollections.length;
        for (uint256 i; i < length; ) {
            address collection = registeredCollections[i];
            uint256 pending = pendingRewards[msg.sender][collection];
            
            if (pending != 0) {
                delete pendingRewards[msg.sender][collection];
                totalClaim += pending;
                emit RewardsClaimed(msg.sender, collection, pending);
            }
            unchecked { ++i; }
        }
        
        require(totalClaim != 0, "No rewards to claim");
        
        // Check return value of transfer
        bool success = sstlToken.transfer(msg.sender, totalClaim);
        require(success, "Transfer failed");
        
        emit AllRewardsClaimed(msg.sender, totalClaim);
    }

    // -----------------------------------------
    // Genesis Revenue Distribution (10% from NFT Sales)
    // -----------------------------------------

    /**
     * @notice Add Genesis revenue from NFT sales (receives BNB from AI Audit NFT as 7th payee)
     * @dev This contract receives BNB when someone mints AI Audit NFT
     *      The 10% share is automatically sent here via the payee system
     * @dev  UPDATE: Now updates revenuePerNFTAccumulator for snapshot-based distribution
     */
    function addGenesisRevenue() external payable {
        require(msg.value != 0, "No BNB sent");
        
        uint256 totalGenesis = genesisCollection.totalSupply();
        
        //  Update accumulator if Genesis NFTs exist
        if (totalGenesis > 0) {
            // Add revenue per existing NFT to accumulator
            revenuePerNFTAccumulator += msg.value / totalGenesis;
        }
        
        totalGenesisRevenue += msg.value;
        
        emit GenesisRevenueAdded(msg.value, totalGenesisRevenue);
    }

  
    function claimGenesisRevenue(uint256 tokenId) public nonReentrant {
        // CHECKS
        require(genesisCollection.ownerOf(tokenId) == msg.sender, "Not owner");
        
        //  Calculate claimable based on accumulator minus debt
        uint256 claimable = revenuePerNFTAccumulator - genesisNFTDebt[tokenId];
        require(claimable > 0, "Nothing to claim");
        
        // EFFECTS (update state BEFORE external call)
        genesisNFTDebt[tokenId] = revenuePerNFTAccumulator; // Update debt to current accumulator
        totalGenesisRevenueClaimed += claimable;
        
        // INTERACTIONS (external call last)
        (bool sent, ) = msg.sender.call{value: claimable}("");
        require(sent, "BNB transfer failed");
        
        emit GenesisRevenueClaimed(msg.sender, tokenId, claimable);
    }

  
    function batchClaimGenesisRevenue(uint256[] calldata tokenIds) external nonReentrant {
        uint256 totalClaim;
        
        // EFFECTS (update state BEFORE external call)
        // Cached array length for gas optimization
        uint256 length = tokenIds.length;
        for (uint256 i; i < length; ) {
            uint256 tokenId = tokenIds[i];
            require(genesisCollection.ownerOf(tokenId) == msg.sender, "Not owner");
            
            //  Calculate claimable based on accumulator minus debt
            uint256 claimable = revenuePerNFTAccumulator - genesisNFTDebt[tokenId];
            if (claimable > 0) {
                genesisNFTDebt[tokenId] = revenuePerNFTAccumulator; // Update debt
                totalClaim += claimable;
            }
            unchecked { ++i; }
        }
        
        require(totalClaim != 0, "Nothing to claim");
        
        // Update total claimed
        totalGenesisRevenueClaimed += totalClaim;
        
        // INTERACTIONS (external call last)
        (bool sent, ) = msg.sender.call{value: totalClaim}("");
        require(sent, "BNB transfer failed");
        
        emit BatchGenesisRevenueClaimed(msg.sender, tokenIds, totalClaim);
    }

    /**
     * @notice Collect dust from integer division rounding errors
     * @dev Only callable by admin. Sends unclaimed BNB dust to treasury.
     *      This prevents small amounts of BNB from being locked forever.
     */
    function collectGenesisDust() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 totalGenesis = genesisCollection.totalSupply();
        require(totalGenesis != 0, "No Genesis NFTs");
        
        // Calculate theoretical maximum claimable
        uint256 perNFT = totalGenesisRevenue / totalGenesis;
        uint256 maxClaimable = perNFT * totalGenesis;
        
        // Dust = total revenue - max claimable
        uint256 dust = totalGenesisRevenue - maxClaimable;
        
        require(dust != 0, "No dust to collect");
        
        // Send dust to treasury
        (bool sent, ) = treasuryWallet.call{value: dust}("");
        require(sent, "Dust transfer failed");
        
        emit GenesisDustCollected(treasuryWallet, dust);
    }

    // -----------------------------------------
    // View Functions
    // -----------------------------------------

    /**
     * @notice Get pending rewards for a user across all collections
     */
    function getPendingRewards(address user) external view returns (uint256 total) {
        // Cached array length for gas optimization
        uint256 length = registeredCollections.length;
        for (uint256 i; i < length; ) {
            total += pendingRewards[user][registeredCollections[i]];
            unchecked { ++i; }
        }
    }

    /**
     * @notice Get pending rewards for a user for a specific collection
     */
    function getPendingRewardsByCollection(
        address user,
        address collection
    ) external view returns (uint256) {
        return pendingRewards[user][collection];
    }

    /**
     * @notice Calculate claimable Genesis revenue for a token ID
     * @dev Uses snapshot-based system - NFTs can only claim revenue generated AFTER mint
     */
    function getClaimableGenesisRevenue(uint256 tokenId) external view returns (uint256) {
        // Use accumulator minus debt (snapshot at mint time)
        uint256 claimable = revenuePerNFTAccumulator - genesisNFTDebt[tokenId];
        return claimable;
    }

    /**
     * @notice Calculate claimable Genesis revenue for multiple token IDs
     * @dev Uses snapshot-based system - NFTs can only claim revenue generated AFTER mint
     */
    function getBatchClaimableGenesisRevenue(
        uint256[] calldata tokenIds
    ) external view returns (uint256 total) {
        // Cached array length for gas optimization
        uint256 length = tokenIds.length;
        for (uint256 i; i < length; ) { // Removed initialization to 0
            // Use accumulator minus debt for each token
            uint256 claimable = revenuePerNFTAccumulator - genesisNFTDebt[tokenIds[i]];
            total += claimable;
            unchecked { ++i; }
        }
    }

    /**
     * @notice Calculate claimable Genesis revenue using legacy method (DEPRECATED)
     * @dev This is the old calculation method - kept for backward compatibility only
     */
    function getClaimableGenesisRevenueLegacy(uint256 tokenId) external view returns (uint256) {
        uint256 totalGenesis = genesisCollection.totalSupply();
        if (totalGenesis == 0) return 0;
        
        uint256 perNFT = totalGenesisRevenue / totalGenesis;
        uint256 claimed = claimedGenesisRevenue[tokenId];
        
        if (perNFT > claimed) {
            return perNFT - claimed;
        }
        return 0;
    }

    /**
     * @notice Calculate claimable Genesis revenue for multiple token IDs using legacy method (DEPRECATED)
     * @dev This is the old calculation method - kept for backward compatibility only
     */
    function getBatchClaimableGenesisRevenueLegacy(
        uint256[] calldata tokenIds
    ) external view returns (uint256 total) {
        uint256 totalGenesis = genesisCollection.totalSupply();
        if (totalGenesis == 0) return 0;
        
        uint256 perNFT = totalGenesisRevenue / totalGenesis;
        
        // Cached array length for gas optimization
        uint256 length = tokenIds.length;
        for (uint256 i; i < length; ) {
            uint256 claimed = claimedGenesisRevenue[tokenIds[i]];
            if (perNFT > claimed) {
                total += (perNFT - claimed);
            }
            unchecked { ++i; }
        }
    }

    /**
     * @notice Get current Genesis dust amount (rounding error remainder)
     */
    function getGenesisDust() external view returns (uint256) {
        uint256 totalGenesis = genesisCollection.totalSupply();
        if (totalGenesis == 0) return 0;
        
        uint256 perNFT = totalGenesisRevenue / totalGenesis;
        uint256 maxClaimable = perNFT * totalGenesis;
        
        return totalGenesisRevenue - maxClaimable;
    }

    /**
     * @notice Get comprehensive statistics
     * @return _totalJobs Total number of jobs completed
     * @return _totalDistributed Total SSTL distributed to NFT holders
     * @return _totalTreasury Total SSTL minted to treasury
     * @return _totalBurned Total SSTL burned
     * @return _totalServiceOwner Total SSTL minted to service owner
     * @return _totalGenesisRevenue Total BNB received for Genesis holders
     * @return _totalGenesisRevenueClaimed Total BNB claimed by Genesis holders
     * @return numCollections Number of registered collections
     */
    function getStats() external view returns (
        uint256 _totalJobs,
        uint256 _totalDistributed,
        uint256 _totalTreasury,
        uint256 _totalBurned,
        uint256 _totalServiceOwner,
        uint256 _totalGenesisRevenue,
        uint256 _totalGenesisRevenueClaimed,
        uint256 numCollections
    ) {
        return (
            totalJobs,
            totalDistributed,
            totalTreasury,
            totalBurned,
            totalServiceOwner,
            totalGenesisRevenue,
            totalGenesisRevenueClaimed,
            registeredCollections.length
        );
    }

    // -----------------------------------------
    // Receive Function (for Genesis Revenue)
    // -----------------------------------------

    /**
     * @notice Fallback to receive BNB for Genesis revenue
     */
    receive() external payable {
        totalGenesisRevenue += msg.value;
        emit GenesisRevenueAdded(msg.value, totalGenesisRevenue);
    }
}
