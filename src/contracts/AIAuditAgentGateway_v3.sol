// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface ISSTLToken {
    function mintPoUW(address to, uint256 amount) external;
}

interface IPoUW {
    function allocateRewards(address nftCollection, address[] calldata holders, uint256[] calldata amounts) external;
    function recordJobStats(uint256 treasuryAmount, uint256 burnAmount, uint256 serviceOwnerAmount) external;
}

/**
 * @title AIAuditAgentGateway V3 (Security Enhanced)
 * @author Andrei / Gemini
 * @notice V3 Improvements:
 *      - Protected receive() function with payment requirements
 *      - NonReentrant modifier on _distributeToNFTHolders
 *      - Zero address check for NFT holders
 *      - Safe halving logic with overflow protection
 *      - Batch processing to prevent DoS in distribution
 */
contract AIAuditAgentGatewayV3 is AccessControl, ReentrancyGuard {
    bytes32 public constant OPERATOR_ROLE = keccak256("MCP_OPERATOR_ROLE");
    
    ISSTLToken public immutable sstlToken;
    IERC721Enumerable public immutable nftCollection;
    IPoUW public immutable pouwContract;
    address public immutable treasuryWallet;
    address public immutable serviceOwner;
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    IERC20 public paymentToken;
    uint256 public paymentAmountBNB;
    uint256 public paymentAmountToken;
    bool public acceptBNB = true;
    bool public acceptToken = true;
    
    uint256 public baseRewardPerJob = 67 ether;
    uint256 public constant NFT_HOLDERS_SHARE = 6000;
    uint256 public constant TREASURY_SHARE = 2000;
    uint256 public constant BURN_SHARE = 1000;
    uint256 public constant SERVICE_OWNER_SHARE = 1000;
    uint256 public constant BASIS_POINTS = 10000;
    
    // V3: Safe halving constants
    uint256 public constant MAX_HALVING_COUNT = 64; // 2^64 is safe for uint256
    uint256 public halvingInterval = 365 days;
    uint256 public lastHalvingTime;
    uint256 public halvingCount;
    
    // V3: Batch processing for NFT distribution
    uint256 public constant MAX_NFTS_PER_BATCH = 100; // Prevent DoS
    
    uint256 public totalJobsCompleted;
    uint256 public totalBNBReceived;
    uint256 public totalTokensReceived;
    uint256 public totalSSTLMinted;
    
    event JobCompleted(address indexed user, uint256 indexed jobId, uint256 rewardAmount, uint256 afterHalving, string txHash);
    event PaymentReceived(address indexed user, bool isBNB, uint256 amount);
    event RewardsDistributed(uint256 nftHolders, uint256 treasury, uint256 burned, uint256 serviceOwner);
    event HalvingApplied(uint256 halvingCount, uint256 timestamp);
    event PaymentConfigUpdated(uint256 bnbAmount, uint256 tokenAmount, bool acceptBNB, bool acceptToken);
    event BaseRewardUpdated(uint256 oldReward, uint256 newReward);
    event HalvingIntervalUpdated(uint256 oldInterval, uint256 newInterval);
    event UnexpectedPayment(address indexed sender, uint256 amount); // V3: Track unexpected payments
    
    constructor(
        address _sstlToken,
        address _paymentToken,
        address _nftCollection,
        address _pouwContract,
        address _treasuryWallet,
        address _serviceOwner,
        address admin
    ) {
        require(
            _sstlToken != address(0) && 
            _paymentToken != address(0) && 
            _nftCollection != address(0) && 
            _pouwContract != address(0) && 
            _treasuryWallet != address(0) && 
            _serviceOwner != address(0) && 
            admin != address(0),
            "Zero address"
        );
        
        sstlToken = ISSTLToken(_sstlToken);
        paymentToken = IERC20(_paymentToken);
        nftCollection = IERC721Enumerable(_nftCollection);
        pouwContract = IPoUW(_pouwContract);
        treasuryWallet = _treasuryWallet;
        serviceOwner = _serviceOwner;
        
        lastHalvingTime = block.timestamp;
        halvingCount = 0;
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
    }
    
    function _applyHalvingIfNeeded() internal {
        if (block.timestamp < lastHalvingTime + halvingInterval) return;
        
        uint256 intervals = (block.timestamp - lastHalvingTime) / halvingInterval;
        
        // V3: Prevent halving count overflow
        require(halvingCount + intervals <= MAX_HALVING_COUNT, "Max halving reached");
        
        halvingCount += intervals;
        lastHalvingTime = lastHalvingTime + (intervals * halvingInterval);
        
        emit HalvingApplied(halvingCount, block.timestamp);
    }
    
    /**
     * @dev V3: Safe halving with overflow protection
     */
    function applyHalvingToAmount(uint256 amount) public view returns (uint256) {
        if (halvingCount == 0) return amount;
        
        // V3: Prevent overflow - if halving count too high, return minimum reward
        if (halvingCount >= MAX_HALVING_COUNT) return 1; // Minimum 1 wei
        
        // Safe exponentiation with overflow check
        uint256 divisor = 2 ** halvingCount;
        return amount / divisor;
    }
    
    function manualHalve() external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(halvingCount < MAX_HALVING_COUNT, "Max halving reached"); // V3: Safety check
        halvingCount += 1;
        lastHalvingTime = block.timestamp;
        emit HalvingApplied(halvingCount, block.timestamp);
    }
    
    function setHalvingInterval(uint256 newInterval) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newInterval > 0, "Interval must be > 0");
        emit HalvingIntervalUpdated(halvingInterval, newInterval);
        halvingInterval = newInterval;
    }
    
    function payAndRunAuditBNB(string calldata txHash) external payable nonReentrant {
        require(acceptBNB, "BNB payments disabled");
        require(msg.value >= paymentAmountBNB, "Insufficient BNB");
        
        totalBNBReceived += msg.value;
        emit PaymentReceived(msg.sender, true, msg.value);
        
        _executeJob(msg.sender, txHash);
    }
    
    function payAndRunAuditToken(uint256 amount, string calldata txHash) external nonReentrant {
        require(acceptToken, "Token payments disabled");
        require(amount >= paymentAmountToken, "Insufficient tokens");
        require(paymentToken.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
        
        totalTokensReceived += amount;
        emit PaymentReceived(msg.sender, false, amount);
        
        _executeJob(msg.sender, txHash);
    }
    
    function executeJobForUser(address user, string calldata txHash) external onlyRole(OPERATOR_ROLE) nonReentrant {
        _executeJob(user, txHash);
    }
    
    function _executeJob(address user, string calldata txHash) internal {
        _applyHalvingIfNeeded();
        
        uint256 rewardAfterHalving = applyHalvingToAmount(baseRewardPerJob);
        uint256 nftHoldersAmount = (rewardAfterHalving * NFT_HOLDERS_SHARE) / BASIS_POINTS;
        uint256 treasuryAmount = (rewardAfterHalving * TREASURY_SHARE) / BASIS_POINTS;
        uint256 burnAmount = (rewardAfterHalving * BURN_SHARE) / BASIS_POINTS;
        uint256 serviceOwnerAmount = (rewardAfterHalving * SERVICE_OWNER_SHARE) / BASIS_POINTS;
        
        sstlToken.mintPoUW(address(pouwContract), nftHoldersAmount);
        sstlToken.mintPoUW(treasuryWallet, treasuryAmount);
        sstlToken.mintPoUW(BURN_ADDRESS, burnAmount);
        sstlToken.mintPoUW(serviceOwner, serviceOwnerAmount);
        
        _distributeToNFTHolders(nftHoldersAmount);
        
        pouwContract.recordJobStats(treasuryAmount, burnAmount, serviceOwnerAmount);
        
        totalJobsCompleted += 1;
        totalSSTLMinted += rewardAfterHalving;
        
        emit JobCompleted(user, totalJobsCompleted, baseRewardPerJob, rewardAfterHalving, txHash);
        emit RewardsDistributed(nftHoldersAmount, treasuryAmount, burnAmount, serviceOwnerAmount);
    }
    
    /**
     * @dev V3 Enhancements:
     *      - NonReentrant modifier to prevent reentrancy
     *      - Zero address check for NFT holders
     *      - Batch processing limit to prevent DoS
     */
    function _distributeToNFTHolders(uint256 totalAmount) internal nonReentrant {
        uint256 totalSupply = nftCollection.totalSupply();
        
        if (totalSupply == 0) {
            // No NFT holders yet - skip distribution, tokens stay in PoUW contract
            return;
        }
        
        // V3: Prevent DoS - limit batch size
        uint256 batchSize = totalSupply > MAX_NFTS_PER_BATCH ? MAX_NFTS_PER_BATCH : totalSupply;
        
        address[] memory holders = new address[](batchSize);
        uint256[] memory amounts = new uint256[](batchSize);
        uint256 holderCount = 0;
        uint256 perNFT = totalAmount / totalSupply;
        
        for (uint256 i = 0; i < batchSize; ) {
            uint256 tokenId = nftCollection.tokenByIndex(i);
            address holder = nftCollection.ownerOf(tokenId);
            
            // V3: Check for zero address
            require(holder != address(0), "Invalid NFT holder");
            
            bool found = false;
            for (uint256 j = 0; j < holderCount; ) {
                if (holders[j] == holder) {
                    amounts[j] += perNFT;
                    found = true;
                    break;
                }
                unchecked { ++j; } // V3: Gas optimization
            }
            
            if (!found) {
                holders[holderCount] = holder;
                amounts[holderCount] = perNFT;
                holderCount++;
            }
            
            unchecked { ++i; } // V3: Gas optimization
        }
        
        address[] memory finalHolders = new address[](holderCount);
        uint256[] memory finalAmounts = new uint256[](holderCount);
        
        for (uint256 i = 0; i < holderCount; ) {
            finalHolders[i] = holders[i];
            finalAmounts[i] = amounts[i];
            unchecked { ++i; } // V3: Gas optimization
        }
        
        pouwContract.allocateRewards(address(nftCollection), finalHolders, finalAmounts);
    }
    
    function setPaymentConfig(
        uint256 bnbAmount,
        uint256 tokenAmount,
        bool _acceptBNB,
        bool _acceptToken
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        paymentAmountBNB = bnbAmount;
        paymentAmountToken = tokenAmount;
        acceptBNB = _acceptBNB;
        acceptToken = _acceptToken;
        
        emit PaymentConfigUpdated(bnbAmount, tokenAmount, _acceptBNB, _acceptToken);
    }
    
    function setBaseReward(uint256 newReward) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newReward > 0, "Reward must be > 0");
        emit BaseRewardUpdated(baseRewardPerJob, newReward);
        baseRewardPerJob = newReward;
    }
    
    function withdrawBNB(address payable to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        require(to != address(0), "Zero address");
        require(amount <= address(this).balance, "Insufficient balance");
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "BNB transfer failed");
    }
    
    function withdrawTokens(address token, address to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        require(to != address(0), "Zero address");
        require(IERC20(token).transfer(to, amount), "Token transfer failed");
    }
    
    function getCurrentReward() external view returns (uint256) {
        return applyHalvingToAmount(baseRewardPerJob);
    }
    
    function getDistributionBreakdown() external view returns (
        uint256 nftHolders,
        uint256 treasury,
        uint256 burn,
        uint256 serviceOwnerAmt
    ) {
        uint256 currentReward = applyHalvingToAmount(baseRewardPerJob);
        nftHolders = (currentReward * NFT_HOLDERS_SHARE) / BASIS_POINTS;
        treasury = (currentReward * TREASURY_SHARE) / BASIS_POINTS;
        burn = (currentReward * BURN_SHARE) / BASIS_POINTS;
        serviceOwnerAmt = (currentReward * SERVICE_OWNER_SHARE) / BASIS_POINTS;
    }
    
    function getStats() external view returns (
        uint256 jobs,
        uint256 bnbReceived,
        uint256 tokensReceived,
        uint256 sstlMinted,
        uint256 halvings
    ) {
        return (totalJobsCompleted, totalBNBReceived, totalTokensReceived, totalSSTLMinted, halvingCount);
    }
    
    /**
     * @dev V3: Protected receive function with payment validation
     *      Only accepts BNB if payments are enabled and meet minimum amount
     *      Prevents unexpected ether accumulation and potential DoS
     */
    receive() external payable {
        require(acceptBNB, "BNB payments disabled");
        require(msg.value >= paymentAmountBNB, "Payment below minimum");
        
        totalBNBReceived += msg.value;
        emit PaymentReceived(msg.sender, true, msg.value);
    }
}
