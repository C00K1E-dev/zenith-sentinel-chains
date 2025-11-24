// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SeedRoundSaleTST
 * @notice Testnet version - Manages locked token sales with vesting (1-hour cliff + 2-hour linear)
 * @dev Users buy SSTLTST tokens with tBNB but cannot claim until vesting period ends
 * @dev Tokens stay locked in contract until cliff + vesting complete
 */
contract SeedRoundSaleTST is Ownable, ReentrancyGuard {
    IERC20 public sstlToken; // SSTLTST token address
    
    // Vesting parameters (in seconds) - TESTNET SHORTENED
    uint256 public constant CLIFF_DURATION = 1 hours;      // 1 hour cliff
    uint256 public constant VESTING_DURATION = 2 hours;    // 2 hours linear vesting after cliff
    uint256 public constant TOTAL_VESTING = CLIFF_DURATION + VESTING_DURATION; // 3 hours total

    // Sale parameters
    // Dynamic Pricing: Start 0.015 BNB, +7.5% every 10k tokens
    uint256 public constant START_PRICE = 15000000000000000; // 0.015 BNB
    uint256 public constant TOKENS_PER_TIER = 10000 * 1e18;
    uint256 public constant PRICE_INCREASE_PERCENT = 75; // 7.5% (75/1000)

    uint256 public totalTokensForSale;
    uint256 public tokensSold;
    uint256 public totalBNBRaised;

    // Buyer data
    struct Purchase {
        uint256 amount;         // Total tokens in this purchase
        uint256 claimed;        // Tokens claimed from this purchase
        uint256 vestingStart;   // When this specific purchase started
    }

    mapping(address => Purchase[]) public purchases;
    address[] public buyers;

    // Events
    event TokensPurchased(
        address indexed buyer,
        uint256 amount,
        uint256 price,
        uint256 totalCost
    );
    event TokensClaimed(address indexed buyer, uint256 amount);
    event SaleConfigured(
        uint256 tokenPrice,
        uint256 totalTokensForSale
    );

    /**
     * @notice Initialize the testnet sale contract
     * @param _sstlToken Address of SSTLTST token (0x53Efbb2DA9CDf2DDe6AD0A0402b7b4427a7F9e89)
     */
    constructor(address _sstlToken) Ownable(msg.sender) {
        require(_sstlToken != address(0), "Invalid token address");
        sstlToken = IERC20(_sstlToken);
    }

    /**
     * @notice Configure sale token amount (price is dynamic)
     * @param _totalTokensForSale Total tokens available for sale (in wei)
     */
    function configureSale(
        uint256 _totalTokensForSale
    ) external onlyOwner {
        require(_totalTokensForSale > 0, "Must have tokens for sale");

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
     * @notice Buy tokens during sale with tBNB (tokens are locked with vesting)
     * Tokens stay in contract - buyer receives them only after vesting unlocks
     */
    function buyTokens() external payable nonReentrant {
        require(msg.value > 0, "Must send tBNB");
        require(totalTokensForSale > 0, "Sale not configured");

        uint256 bnbRemaining = msg.value;
        uint256 totalTokensToBuy = 0;
        uint256 tempTokensSold = tokensSold;

        // Loop to calculate tokens across tiers
        while (bnbRemaining > 0) {
            uint256 currentTier = tempTokensSold / TOKENS_PER_TIER;
            uint256 tokensInCurrentTier = tempTokensSold % TOKENS_PER_TIER;
            uint256 tokensLeftInTier = TOKENS_PER_TIER - tokensInCurrentTier;

            // Price = Start * (1 + tier * 0.075)
            uint256 currentPrice = (START_PRICE * (1000 + (currentTier * PRICE_INCREASE_PERCENT))) / 1000;

            // Tokens affordable with remaining BNB
            uint256 tokensAffordable = (bnbRemaining * 1e18) / currentPrice;

            if (tokensAffordable <= tokensLeftInTier) {
                totalTokensToBuy += tokensAffordable;
                tempTokensSold += tokensAffordable;
                bnbRemaining = 0;
            } else {
                // Buy remainder of tier
                uint256 costForTier = (tokensLeftInTier * currentPrice) / 1e18;
                
                // Rounding safety
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
        
        require(totalTokensToBuy > 0, "Insufficient BNB");
        require(tokensSold + totalTokensToBuy <= totalTokensForSale, "Not enough tokens available");

        // Add new purchase with its own start time
        if (purchases[msg.sender].length == 0) {
            buyers.push(msg.sender);
        }

        purchases[msg.sender].push(Purchase({
            amount: totalTokensToBuy,
            claimed: 0,
            vestingStart: block.timestamp
        }));

        tokensSold += totalTokensToBuy;
        totalBNBRaised += msg.value;

        // Emit effective price
        uint256 effectivePrice = (msg.value * 1e18) / totalTokensToBuy;
        emit TokensPurchased(msg.sender, totalTokensToBuy, effectivePrice, msg.value);
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
            
            // Before cliff ends: 0 tokens claimable for this purchase
            if (block.timestamp < p.vestingStart + CLIFF_DURATION) {
                continue;
            }

            // Calculate vested amount
            uint256 timeAfterCliff = block.timestamp - (p.vestingStart + CLIFF_DURATION);
            uint256 vestedAmount;

            if (timeAfterCliff >= VESTING_DURATION) {
                // All tokens vested
                vestedAmount = p.amount;
            } else {
                // Linear vesting
                vestedAmount = (p.amount * timeAfterCliff) / VESTING_DURATION;
            }

            // Add (vested - claimed) to total
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
     * @param _buyer Address of the buyer
     * @return totalTokens Total tokens purchased
     * @return claimedTokens Tokens already claimed
     * @return claimableTokens Tokens available to claim now
     * @return vestingStart Start time of the LATEST purchase (for UI reference)
     * @return nextClaimTime Estimated time for next claim opportunity
     * @return lockedTokens Tokens still locked (not yet vested)
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
            
            // Track latest start time for UI
            if (p.vestingStart > vestingStart) {
                vestingStart = p.vestingStart;
            }

            // Calculate vested for this purchase
            if (block.timestamp >= p.vestingStart + CLIFF_DURATION) {
                uint256 timeAfterCliff = block.timestamp - (p.vestingStart + CLIFF_DURATION);
                if (timeAfterCliff >= VESTING_DURATION) {
                    totalVested += p.amount;
                } else {
                    totalVested += (p.amount * timeAfterCliff) / VESTING_DURATION;
                    // Currently vesting, so next claim is now
                    earliestNextClaim = block.timestamp;
                }
            } else {
                // In cliff, next claim is end of cliff
                uint256 cliffEnd = p.vestingStart + CLIFF_DURATION;
                if (cliffEnd < earliestNextClaim) {
                    earliestNextClaim = cliffEnd;
                }
            }
        }

        claimableTokens = totalVested - claimedTokens;
        lockedTokens = totalTokens - totalVested;

        // If we have claimable tokens, next claim is now
        if (claimableTokens > 0) {
            nextClaimTime = block.timestamp;
        } else if (earliestNextClaim != type(uint256).max) {
            nextClaimTime = earliestNextClaim;
        } else {
            nextClaimTime = 0; // All done
        }
    }

    /**
     * @notice Withdraw unsold tokens (owner only)
     */
    function withdrawUnsoldTokens() external onlyOwner {
        uint256 unsold = totalTokensForSale - tokensSold;
        if (unsold > 0) {
            sstlToken.transfer(msg.sender, unsold);
        }
    }

    /**
     * @notice Withdraw collected tBNB (owner only)
     */
    function withdrawBNB() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No BNB to withdraw");
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "BNB transfer failed");
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

    /**
     * @notice Get contract stats
     */
    function getStats() external view returns (uint256, uint256, uint256) {
        return (tokensSold, totalTokensForSale, totalBNBRaised);
    }

    // Allow contract to receive BNB
    receive() external payable {}
}
