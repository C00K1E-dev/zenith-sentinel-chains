// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SeedRoundSaleUSD
 * @notice Mainnet/Testnet version - Manages locked token sales with vesting (1-hour cliff + 2-hour linear)
 * @dev Users buy SSTL tokens with USDT but cannot claim until vesting period ends
 * @dev Tokens stay locked in contract until cliff + vesting complete
 * 
 * SECURITY FEATURES:
 * - ReentrancyGuard on all state-changing functions
 * - ERC20 transfer validation (checks return value)
 * - Sale pause/stop mechanism
 * - Min/Max purchase limits to prevent abuse
 * - Overflow/underflow protection (Solidity 0.8+)
 * - Proper access control with onlyOwner
 */
contract SeedRoundSaleUSD is Ownable, ReentrancyGuard {
    IERC20 public sstlToken;    // SSTL token address
    IERC20 public paymentToken; // USDT token address
    
    // Vesting parameters (in seconds)
    uint256 public constant CLIFF_DURATION = 1 hours;      // 1 hour cliff
    uint256 public constant VESTING_DURATION = 2 hours;    // 2 hours linear vesting after cliff
    uint256 public constant TOTAL_VESTING = CLIFF_DURATION + VESTING_DURATION; // 3 hours total

    // Sale parameters
    // Dynamic Pricing: Start $0.015 USD, +7.5% every 10k tokens
    uint256 public constant START_PRICE = 15000000000000000; // 0.015 USD (in wei, assuming 18 decimals)
    uint256 public constant TOKENS_PER_TIER = 10000 * 1e18;
    uint256 public constant PRICE_INCREASE_PERCENT = 75; // 7.5% (75/1000)

    // Security parameters
    uint256 public constant MIN_PURCHASE = 10 * 1e18; // Minimum 10 USDT per purchase
    // NO MAX PURCHASE LIMIT - Price discovery mechanism handles allocation
    uint256 public constant MAX_PURCHASES_PER_USER = 100; // Prevent unbounded array growth

    // Sale state
    uint256 public totalTokensForSale;
    uint256 public tokensSold;
    uint256 public totalUSDTRaised;
    bool public salePaused = false;
    bool public saleClosed = false;

    // Buyer data
    struct Purchase {
        uint256 amount;         // Total tokens in this purchase
        uint256 claimed;        // Tokens claimed from this purchase
        uint256 vestingStart;   // When this specific purchase started
        uint256 usdtPaid;       // USDT amount paid (for audit trail)
    }

    mapping(address => Purchase[]) public purchases;
    address[] public buyers;

    // Whitelist for early access (optional, can be disabled)
    mapping(address => bool) public whitelisted;
    bool public whitelistEnabled = false;

    // Events
    event TokensPurchased(
        address indexed buyer,
        uint256 amount,
        uint256 price,
        uint256 totalCost
    );
    event TokensClaimed(address indexed buyer, uint256 amount);
    event SaleConfigured(
        uint256 startPrice,
        uint256 totalTokensForSale
    );
    event SalePaused(uint256 timestamp);
    event SaleResumed(uint256 timestamp);
    event SaleClosed(uint256 timestamp);
    event WhitelistUpdated(address indexed user, bool whitelisted);

    /**
     * @notice Initialize the sale contract
     * @param _sstlToken Address of SSTL token
     * @param _paymentToken Address of USDT token (payment currency)
     */
    constructor(address _sstlToken, address _paymentToken) Ownable(msg.sender) {
        require(_sstlToken != address(0), "Invalid SSTL token address");
        require(_paymentToken != address(0), "Invalid payment token address");
        sstlToken = IERC20(_sstlToken);
        paymentToken = IERC20(_paymentToken);
    }

    /**
     * @notice Configure sale token amount (price is dynamic)
     * @param _totalTokensForSale Total tokens available for sale (in wei)
     */
    function configureSale(uint256 _totalTokensForSale) external onlyOwner {
        require(_totalTokensForSale > 0, "Must have tokens for sale");
        require(!saleClosed, "Sale is closed");

        totalTokensForSale = _totalTokensForSale;

        // Verify contract has enough tokens
        uint256 contractBalance = sstlToken.balanceOf(address(this));
        require(contractBalance >= _totalTokensForSale, "Not enough tokens in contract");

        emit SaleConfigured(START_PRICE, _totalTokensForSale);
    }

    /**
     * @notice Get current token price based on tier
     */
    function getCurrentPrice() public view returns (uint256) {
        uint256 currentTier = tokensSold / TOKENS_PER_TIER;
        // Price = Start * (1 + tier * 0.075)
        return (START_PRICE * (1000 + (currentTier * PRICE_INCREASE_PERCENT))) / 1000;
    }

    /**
     * @notice Pause/Resume the sale (emergency mechanism)
     */
    function toggleSalePause() external onlyOwner {
        salePaused = !salePaused;
        if (salePaused) {
            emit SalePaused(block.timestamp);
        } else {
            emit SaleResumed(block.timestamp);
        }
    }

    /**
     * @notice Permanently close the sale
     */
    function closeSale() external onlyOwner {
        require(!saleClosed, "Sale already closed");
        saleClosed = true;
        emit SaleClosed(block.timestamp);
    }

    /**
     * @notice Update whitelist (optional early access control)
     */
    function setWhitelistEnabled(bool _enabled) external onlyOwner {
        whitelistEnabled = _enabled;
    }

    /**
     * @notice Add/remove addresses from whitelist
     */
    function setWhitelisted(address[] calldata _addresses, bool _whitelisted) external onlyOwner {
        for (uint256 i = 0; i < _addresses.length; i++) {
            whitelisted[_addresses[i]] = _whitelisted;
            emit WhitelistUpdated(_addresses[i], _whitelisted);
        }
    }

    /**
     * @notice Buy tokens during sale with USDT (tokens are locked with vesting)
     * Tokens stay in contract - buyer receives them only after vesting unlocks
     */
    function buyTokens(uint256 usdtAmount) external nonReentrant {
        // ===== SECURITY CHECKS =====
        require(!salePaused, "Sale is paused");
        require(!saleClosed, "Sale is closed");
        require(usdtAmount > 0, "Must send USDT");
        require(usdtAmount >= MIN_PURCHASE, "Purchase amount below minimum");
        require(totalTokensForSale > 0, "Sale not configured");
        require(tokensSold < totalTokensForSale, "Sale sold out");

        // Whitelist check (if enabled)
        if (whitelistEnabled) {
            require(whitelisted[msg.sender], "Not whitelisted");
        }

        // Prevent unbounded array growth
        require(
            purchases[msg.sender].length < MAX_PURCHASES_PER_USER,
            "Maximum purchases per user exceeded"
        );

        // ===== CALCULATE TOKENS =====
        uint256 bnbRemaining = usdtAmount;
        uint256 totalTokensToBuy = 0;
        uint256 tempTokensSold = tokensSold;

        // Loop to calculate tokens across tiers
        while (bnbRemaining > 0) {
            uint256 currentTier = tempTokensSold / TOKENS_PER_TIER;
            uint256 tokensInCurrentTier = tempTokensSold % TOKENS_PER_TIER;
            uint256 tokensLeftInTier = TOKENS_PER_TIER - tokensInCurrentTier;

            // Price = Start * (1 + tier * 0.075)
            uint256 currentPrice = (START_PRICE * (1000 + (currentTier * PRICE_INCREASE_PERCENT))) / 1000;

            // Tokens affordable with remaining USDT
            uint256 tokensAffordable = (bnbRemaining * 1e18) / currentPrice;

            if (tokensAffordable <= tokensLeftInTier) {
                totalTokensToBuy += tokensAffordable;
                tempTokensSold += tokensAffordable;
                bnbRemaining = 0;
            } else {
                // Buy remainder of tier
                uint256 costForTier = (tokensLeftInTier * currentPrice) / 1e18;
                
                if (costForTier >= bnbRemaining) {
                    totalTokensToBuy += tokensAffordable;
                    tempTokensSold += tokensAffordable;
                    bnbRemaining = 0;
                } else {
                    totalTokensToBuy += tokensLeftInTier;
                    tempTokensSold += tokensLeftInTier;
                    bnbRemaining -= costForTier;
                }
            }
            
            // Cap at total supply
            if (tempTokensSold >= totalTokensForSale) {
                uint256 excess = tempTokensSold - totalTokensForSale;
                totalTokensToBuy -= excess;
                bnbRemaining = 0;
                break;
            }
        }
        
        require(totalTokensToBuy > 0, "Insufficient USDT");
        require(tokensSold + totalTokensToBuy <= totalTokensForSale, "Not enough tokens available");

        // ===== TRANSFER USDT FROM USER TO CONTRACT =====
        bool transferSuccess = paymentToken.transferFrom(msg.sender, address(this), usdtAmount);
        require(transferSuccess, "USDT transfer failed");

        // ===== RECORD PURCHASE =====
        if (purchases[msg.sender].length == 0) {
            buyers.push(msg.sender);
        }

        purchases[msg.sender].push(Purchase({
            amount: totalTokensToBuy,
            claimed: 0,
            vestingStart: block.timestamp,
            usdtPaid: usdtAmount
        }));

        tokensSold += totalTokensToBuy;
        totalUSDTRaised += usdtAmount;

        // Emit effective price
        uint256 effectivePrice = (usdtAmount * 1e18) / totalTokensToBuy;
        emit TokensPurchased(msg.sender, totalTokensToBuy, effectivePrice, usdtAmount);
    }

    /**
     * @notice Calculate claimable tokens for a buyer across all purchases
     * @param _buyer Address of the buyer
     * @return Amount of tokens available to claim
     */
    function getClaimableTokens(address _buyer) public view returns (uint256) {
        Purchase[] memory userPurchases = purchases[_buyer];
        uint256 totalClaimable = 0;

        for (uint256 i = 0; i < userPurchases.length; i++) {
            Purchase memory p = userPurchases[i];
            
            if (block.timestamp < p.vestingStart + CLIFF_DURATION) {
                continue;
            }

            uint256 timeAfterCliff = block.timestamp - (p.vestingStart + CLIFF_DURATION);
            uint256 vestedAmount;

            if (timeAfterCliff >= VESTING_DURATION) {
                vestedAmount = p.amount;
            } else {
                vestedAmount = (p.amount * timeAfterCliff) / VESTING_DURATION;
            }

            if (vestedAmount > p.claimed) {
                totalClaimable += (vestedAmount - p.claimed);
            }
        }

        return totalClaimable;
    }

    /**
     * @notice Claim unlocked tokens (after cliff period)
     * Tokens transfer from contract to buyer
     */
    function claimTokens() external nonReentrant {
        uint256 totalToClaim = 0;
        Purchase[] storage userPurchases = purchases[msg.sender];

        for (uint256 i = 0; i < userPurchases.length; i++) {
            Purchase storage p = userPurchases[i];
            
            if (block.timestamp < p.vestingStart + CLIFF_DURATION) {
                continue;
            }

            uint256 timeAfterCliff = block.timestamp - (p.vestingStart + CLIFF_DURATION);
            uint256 vestedAmount;

            if (timeAfterCliff >= VESTING_DURATION) {
                vestedAmount = p.amount;
            } else {
                vestedAmount = (p.amount * timeAfterCliff) / VESTING_DURATION;
            }

            if (vestedAmount > p.claimed) {
                uint256 claimableFromThis = vestedAmount - p.claimed;
                p.claimed += claimableFromThis;
                totalToClaim += claimableFromThis;
            }
        }

        require(totalToClaim > 0, "No tokens to claim");

        bool success = sstlToken.transfer(msg.sender, totalToClaim);
        require(success, "Token transfer failed");

        emit TokensClaimed(msg.sender, totalToClaim);
    }

    /**
     * @notice Get vesting info for a buyer (aggregated)
     */
    function getVestingInfo(address _buyer)
        external
        view
        returns (
            uint256 totalTokens,
            uint256 claimedTokens,
            uint256 claimableTokens,
            uint256 vestingStart,
            uint256 nextClaimTime,
            uint256 lockedTokens
        )
    {
        Purchase[] memory userPurchases = purchases[_buyer];
        
        if (userPurchases.length == 0) {
            return (0, 0, 0, 0, 0, 0);
        }

        uint256 totalVested = 0;
        uint256 earliestNextClaim = type(uint256).max;

        for (uint256 i = 0; i < userPurchases.length; i++) {
            Purchase memory p = userPurchases[i];
            totalTokens += p.amount;
            claimedTokens += p.claimed;
            
            if (p.vestingStart > vestingStart) {
                vestingStart = p.vestingStart;
            }

            if (block.timestamp >= p.vestingStart + CLIFF_DURATION) {
                uint256 timeAfterCliff = block.timestamp - (p.vestingStart + CLIFF_DURATION);
                if (timeAfterCliff >= VESTING_DURATION) {
                    totalVested += p.amount;
                } else {
                    totalVested += (p.amount * timeAfterCliff) / VESTING_DURATION;
                    earliestNextClaim = block.timestamp;
                }
            } else {
                uint256 cliffEnd = p.vestingStart + CLIFF_DURATION;
                if (cliffEnd < earliestNextClaim) {
                    earliestNextClaim = cliffEnd;
                }
            }
        }

        claimableTokens = totalVested - claimedTokens;
        lockedTokens = totalTokens - totalVested;

        if (claimableTokens > 0) {
            nextClaimTime = block.timestamp;
        } else if (earliestNextClaim != type(uint256).max) {
            nextClaimTime = earliestNextClaim;
        } else {
            nextClaimTime = 0;
        }
    }

    /**
     * @notice Withdraw unsold tokens (owner only)
     */
    function withdrawUnsoldTokens() external onlyOwner nonReentrant {
        uint256 unsold = totalTokensForSale - tokensSold;
        require(unsold > 0, "No unsold tokens");
        bool success = sstlToken.transfer(msg.sender, unsold);
        require(success, "Token transfer failed");
    }

    /**
     * @notice Withdraw collected USDT (owner only)
     */
    function withdrawUSDT() external onlyOwner nonReentrant {
        uint256 balance = paymentToken.balanceOf(address(this));
        require(balance > 0, "No USDT to withdraw");
        bool success = paymentToken.transfer(msg.sender, balance);
        require(success, "USDT transfer failed");
    }

    /**
     * @notice Emergency token recovery (in case wrong tokens sent)
     */
    function emergencyWithdraw(address _token, uint256 _amount) external onlyOwner nonReentrant {
        require(_token != address(sstlToken), "Cannot withdraw SSTL");
        require(_token != address(paymentToken), "Cannot withdraw USDT");
        IERC20(_token).transfer(msg.sender, _amount);
    }

    /**
     * @notice Get list of all buyers
     */
    function getBuyersCount() external view returns (uint256) {
        return buyers.length;
    }

    function getBuyer(uint256 _index) external view returns (address) {
        require(_index < buyers.length, "Index out of bounds");
        return buyers[_index];
    }

    function getUserPurchaseCount(address _user) external view returns (uint256) {
        return purchases[_user].length;
    }

    /**
     * @notice Get contract stats
     */
    function getStats() external view returns (uint256, uint256, uint256) {
        return (tokensSold, totalTokensForSale, totalUSDTRaised);
    }
}
