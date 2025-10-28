// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SmartSentinels Proof of Useful Work Distribution Contract
 * @author Andrei / Gemini
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
    // State Variables
    // -----------------------------------------
    IERC20 public immutable sstlToken;
    IERC721Enumerable public genesisCollection;
    address public treasuryWallet;
    address public serviceOwner;
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;

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
    uint256 public totalGenesisRevenue;  // Total BNB received for Genesis holders
    mapping(uint256 => uint256) public claimedGenesisRevenue;  // Genesis tokenId => claimed amount

    // -----------------------------------------
    // Statistics Tracking
    // -----------------------------------------
    uint256 public totalJobs;              // Total AI agent jobs completed
    uint256 public totalDistributed;       // Total SSTL allocated to NFT holders (60%)
    uint256 public totalTreasury;          // Total SSTL minted to treasury (20%)
    uint256 public totalBurned;            // Total SSTL burned (10%)
    uint256 public totalServiceOwner;      // Total SSTL minted to service owner (10%)
    
    // Per-collection statistics
    mapping(address => uint256) public totalDistributedByCollection;

    // -----------------------------------------
    // Events
    // -----------------------------------------
    event CollectionRegistered(address indexed collection);
    event CollectionRemoved(address indexed collection);
    event RewardsAllocated(
        address indexed collection,
        uint256 totalAmount,
        uint256 jobNumber
    );
    event RewardsClaimed(address indexed user, address indexed collection, uint256 amount);
    event AllRewardsClaimed(address indexed user, uint256 totalAmount);
    event GenesisRevenueAdded(uint256 amount, uint256 totalRevenue);
    event GenesisRevenueClaimed(address indexed user, uint256 tokenId, uint256 amount);
    event BatchGenesisRevenueClaimed(address indexed user, uint256[] tokenIds, uint256 totalAmount);
    event JobCompleted(
        uint256 indexed jobNumber,
        uint256 totalMinted,
        uint256 nftShare,
        uint256 treasuryShare,
        uint256 burnShare,
        uint256 serviceOwnerShare
    );
    event TreasuryUpdated(address oldWallet, address newWallet);
    event ServiceOwnerUpdated(address oldOwner, address newOwner);
    event GenesisCollectionUpdated(address oldCollection, address newCollection);

    // -----------------------------------------
    // Constructor
    // -----------------------------------------
    constructor(
        address _sstlToken,
        address _genesisCollection,
        address _treasuryWallet,
        address _serviceOwner,
        address admin
    ) {
        require(
            _sstlToken != address(0) &&
            _genesisCollection != address(0) &&
            _treasuryWallet != address(0) &&
            _serviceOwner != address(0) &&
            admin != address(0),
            "Zero address"
        );

        sstlToken = IERC20(_sstlToken);
        genesisCollection = IERC721Enumerable(_genesisCollection);
        treasuryWallet = _treasuryWallet;
        serviceOwner = _serviceOwner;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // -----------------------------------------
    // Collection Management
    // -----------------------------------------

    /**
     * @notice Register a new NFT collection for PoUW rewards
     * @param collection The NFT collection address
     * @dev Only admin can register collections
     */
    function registerCollection(address collection) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(collection != address(0), "Zero address");
        require(!isRegisteredCollection[collection], "Already registered");
        require(collection != address(genesisCollection), "Cannot register Genesis");

        isRegisteredCollection[collection] = true;
        registeredCollections.push(collection);
        
        emit CollectionRegistered(collection);
    }

    /**
     * @notice Remove a collection from PoUW rewards
     * @param collection The NFT collection address
     * @dev Only admin can remove collections
     */
    function removeCollection(address collection) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(isRegisteredCollection[collection], "Not registered");
        
        isRegisteredCollection[collection] = false;
        
        // Remove from array (swap and pop)
        for (uint256 i = 0; i < registeredCollections.length; i++) {
            if (registeredCollections[i] == collection) {
                registeredCollections[i] = registeredCollections[registeredCollections.length - 1];
                registeredCollections.pop();
                break;
            }
        }
        
        emit CollectionRemoved(collection);
    }

    /**
     * @notice Get all registered collections
     * @return Array of collection addresses
     */
    function getRegisteredCollections() external view returns (address[] memory) {
        return registeredCollections;
    }

    // -----------------------------------------
    // Reward Allocation (Called by Gateways)
    // -----------------------------------------

    /**
     * @notice Allocate PoUW rewards to NFT holders (called by gateway after job completion)
     * @param nftCollection The NFT collection address
     * @param holders Array of NFT holder addresses
     * @param amounts Array of reward amounts per holder
     * @dev Gateway must have GATEWAY_ROLE
     *      Gateway handles minting to treasury, burn, and service owner
     *      Gateway also handles halving logic before calling this function
     *      This function only tracks allocations for NFT holders (60% share)
     */
    function allocateRewards(
        address nftCollection,
        address[] calldata holders,
        uint256[] calldata amounts
    ) external onlyRole(GATEWAY_ROLE) nonReentrant {
        require(holders.length == amounts.length, "Length mismatch");
        require(isRegisteredCollection[nftCollection], "Collection not registered");
        
        uint256 totalAmount = 0;
        
        // Allocate to holders
        for (uint256 i = 0; i < holders.length; i++) {
            pendingRewards[holders[i]][nftCollection] += amounts[i];
            totalAmount += amounts[i];
        }
        
        // Update statistics
        totalJobs += 1;
        totalDistributed += totalAmount;
        totalDistributedByCollection[nftCollection] += totalAmount;
        
        emit RewardsAllocated(nftCollection, totalAmount, totalJobs);
    }

    /**
     * @notice Record statistics when gateway mints tokens (called by gateway)
     * @param treasuryAmount Amount minted to treasury
     * @param burnAmount Amount burned
     * @param serviceOwnerAmount Amount minted to service owner
     * @dev Gateway calls this to track total mints across all recipients
     */
    function recordJobStats(
        uint256 treasuryAmount,
        uint256 burnAmount,
        uint256 serviceOwnerAmount
    ) external onlyRole(GATEWAY_ROLE) {
        totalTreasury += treasuryAmount;
        totalBurned += burnAmount;
        totalServiceOwner += serviceOwnerAmount;
        
        emit JobCompleted(
            totalJobs,
            treasuryAmount + burnAmount + serviceOwnerAmount,
            0,  // NFT share tracked in allocateRewards
            treasuryAmount,
            burnAmount,
            serviceOwnerAmount
        );
    }

    // -----------------------------------------
    // User Claiming (PoUW Rewards)
    // -----------------------------------------

    /**
     * @notice Claim pending rewards from a specific collection
     * @param nftCollection The NFT collection address
     */
    function claimRewards(address nftCollection) external nonReentrant {
        uint256 pending = pendingRewards[msg.sender][nftCollection];
        require(pending > 0, "No rewards to claim");
        
        pendingRewards[msg.sender][nftCollection] = 0;
        
        // Transfer tokens from this contract to user
        require(sstlToken.transfer(msg.sender, pending), "Transfer failed");
        
        emit RewardsClaimed(msg.sender, nftCollection, pending);
    }

    /**
     * @notice Claim ALL pending rewards from ALL collections in 1 transaction
     * @dev This is the main user-facing claim function
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
        
        // Transfer tokens from this contract to user
        require(sstlToken.transfer(msg.sender, totalClaim), "Transfer failed");
        
        emit AllRewardsClaimed(msg.sender, totalClaim);
    }

    // -----------------------------------------
    // Genesis Revenue Distribution (10% from NFT Sales)
    // -----------------------------------------

    /**
     * @notice Add Genesis revenue from NFT sales (receives BNB from AI Audit NFT as 7th payee)
     * @dev This contract receives BNB when someone mints AI Audit NFT
     *      The 10% share is automatically sent here via the payee system
     */
    function addGenesisRevenue() external payable {
        require(msg.value > 0, "No BNB sent");
        
        totalGenesisRevenue += msg.value;
        
        emit GenesisRevenueAdded(msg.value, totalGenesisRevenue);
    }

    /**
     * @notice Claim Genesis revenue for a specific Genesis NFT
     * @param tokenId The Genesis NFT token ID
     */
    function claimGenesisRevenue(uint256 tokenId) public nonReentrant {
        require(genesisCollection.ownerOf(tokenId) == msg.sender, "Not owner");
        
        uint256 totalGenesis = genesisCollection.totalSupply();
        require(totalGenesis > 0, "No Genesis NFTs");
        
        uint256 perNFT = totalGenesisRevenue / totalGenesis;
        uint256 claimed = claimedGenesisRevenue[tokenId];
        require(perNFT > claimed, "Nothing to claim");
        
        uint256 claimable = perNFT - claimed;
        claimedGenesisRevenue[tokenId] = perNFT;
        
        // Send BNB to user
        (bool sent, ) = msg.sender.call{value: claimable}("");
        require(sent, "BNB transfer failed");
        
        emit GenesisRevenueClaimed(msg.sender, tokenId, claimable);
    }

    /**
     * @notice Claim Genesis revenue for multiple Genesis NFTs
     * @param tokenIds Array of Genesis NFT token IDs
     */
    function batchClaimGenesisRevenue(uint256[] calldata tokenIds) external nonReentrant {
        uint256 totalClaim = 0;
        uint256 totalGenesis = genesisCollection.totalSupply();
        require(totalGenesis > 0, "No Genesis NFTs");
        
        uint256 perNFT = totalGenesisRevenue / totalGenesis;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            require(genesisCollection.ownerOf(tokenId) == msg.sender, "Not owner");
            
            uint256 claimed = claimedGenesisRevenue[tokenId];
            if (perNFT > claimed) {
                uint256 claimable = perNFT - claimed;
                claimedGenesisRevenue[tokenId] = perNFT;
                totalClaim += claimable;
            }
        }
        
        require(totalClaim > 0, "Nothing to claim");
        
        // Send BNB to user
        (bool sent, ) = msg.sender.call{value: totalClaim}("");
        require(sent, "BNB transfer failed");
        
        emit BatchGenesisRevenueClaimed(msg.sender, tokenIds, totalClaim);
    }

    // -----------------------------------------
    // View Functions (Pending Amounts)
    // -----------------------------------------

    /**
     * @notice Get pending PoUW rewards for a user from a specific collection
     * @param user User address
     * @param collection NFT collection address
     * @return Pending SSTL amount
     */
    function getPendingRewards(address user, address collection) external view returns (uint256) {
        return pendingRewards[user][collection];
    }

    /**
     * @notice Get total pending PoUW rewards for a user across ALL collections
     * @param user User address
     * @return Total pending SSTL amount
     */
    function getTotalPendingRewards(address user) external view returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < registeredCollections.length; i++) {
            total += pendingRewards[user][registeredCollections[i]];
        }
        return total;
    }

    /**
     * @notice Get pending rewards breakdown by collection for a user
     * @param user User address
     * @return collections Array of collection addresses
     * @return amounts Array of pending amounts per collection
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
     * @notice Get pending Genesis revenue for a specific Genesis NFT
     * @param tokenId Genesis NFT token ID
     * @return Pending BNB amount
     */
    function getPendingGenesisRevenue(uint256 tokenId) external view returns (uint256) {
        uint256 totalGenesis = genesisCollection.totalSupply();
        if (totalGenesis == 0) return 0;
        
        uint256 perNFT = totalGenesisRevenue / totalGenesis;
        uint256 claimed = claimedGenesisRevenue[tokenId];
        
        if (perNFT > claimed) {
            return perNFT - claimed;
        } else {
            return 0;
        }
    }

    /**
     * @notice Get total pending Genesis revenue for a user (all their Genesis NFTs)
     * @param user User address
     * @return Total pending BNB amount
     */
    function getTotalPendingGenesisRevenue(address user) external view returns (uint256) {
        uint256 balance = genesisCollection.balanceOf(user);
        if (balance == 0) return 0;
        
        uint256 totalGenesis = genesisCollection.totalSupply();
        if (totalGenesis == 0) return 0;
        
        uint256 perNFT = totalGenesisRevenue / totalGenesis;
        uint256 totalPending = 0;
        
        for (uint256 i = 0; i < balance; i++) {
            uint256 tokenId = genesisCollection.tokenOfOwnerByIndex(user, i);
            uint256 claimed = claimedGenesisRevenue[tokenId];
            if (perNFT > claimed) {
                totalPending += (perNFT - claimed);
            }
        }
        
        return totalPending;
    }

    // -----------------------------------------
    // Statistics View Functions
    // -----------------------------------------

    /**
     * @notice Get complete system statistics
     * @return jobs Total AI agent jobs completed
     * @return distributed Total SSTL allocated to NFT holders
     * @return treasury Total SSTL minted to treasury
     * @return burned Total SSTL burned
     * @return serviceOwnerTotal Total SSTL minted to service owner
     * @return genesisRevenue Total BNB received for Genesis holders
     */
    function getSystemStats() 
        external 
        view 
        returns (
            uint256 jobs,
            uint256 distributed,
            uint256 treasury,
            uint256 burned,
            uint256 serviceOwnerTotal,
            uint256 genesisRevenue
        ) 
    {
        return (
            totalJobs,
            totalDistributed,
            totalTreasury,
            totalBurned,
            totalServiceOwner,
            totalGenesisRevenue
        );
    }

    /**
     * @notice Get statistics for a specific collection
     * @param collection NFT collection address
     * @return totalDist Total SSTL distributed to this collection's holders
     * @return isReg Whether the collection is registered
     */
    function getCollectionStats(address collection) 
        external 
        view 
        returns (uint256 totalDist, bool isReg) 
    {
        return (
            totalDistributedByCollection[collection],
            isRegisteredCollection[collection]
        );
    }

    // -----------------------------------------
    // Admin Configuration
    // -----------------------------------------

    /**
     * @notice Update treasury wallet address
     * @param newWallet New treasury wallet address
     */
    function setTreasuryWallet(address newWallet) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newWallet != address(0), "Zero address");
        address old = treasuryWallet;
        treasuryWallet = newWallet;
        emit TreasuryUpdated(old, newWallet);
    }

    /**
     * @notice Update service owner address
     * @param newOwner New service owner address
     */
    function setServiceOwner(address newOwner) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newOwner != address(0), "Zero address");
        address old = serviceOwner;
        serviceOwner = newOwner;
        emit ServiceOwnerUpdated(old, newOwner);
    }

    /**
     * @notice Update Genesis collection address
     * @param newCollection New Genesis collection address
     */
    function setGenesisCollection(address newCollection) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newCollection != address(0), "Zero address");
        address old = address(genesisCollection);
        genesisCollection = IERC721Enumerable(newCollection);
        emit GenesisCollectionUpdated(old, newCollection);
    }

    // -----------------------------------------
    // Receive BNB (For Genesis Revenue)
    // -----------------------------------------

    /**
     * @notice Receive BNB from AI Audit NFT contract (as 7th payee)
     * @dev Automatically adds to Genesis revenue pool
     */
    receive() external payable {
        if (msg.value > 0) {
            totalGenesisRevenue += msg.value;
            emit GenesisRevenueAdded(msg.value, totalGenesisRevenue);
        }
    }
}
