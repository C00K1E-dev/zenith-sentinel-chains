// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SeedRoundSale
 * @notice Manages locked token sales with vesting (12-month cliff + 18-month linear)
 * @dev Users buy tokens but cannot transfer/claim until vesting period ends
 */
contract SeedRoundSale is Ownable, ReentrancyGuard {
    IERC20 public sstlToken;
    IERC20 public paymentToken; // USDT, USDC, BNB, etc.

    // Vesting parameters (in seconds)
    uint256 public constant CLIFF_DURATION = 365 days; // 12 months
    uint256 public constant VESTING_DURATION = 540 days; // 18 months linear after cliff
    uint256 public constant TOTAL_VESTING = CLIFF_DURATION + VESTING_DURATION; // 30 months

    // Sale parameters
    uint256 public saleStart;
    uint256 public saleEnd;
    uint256 public tokenPrice; // Price in payment token (e.g., USDC per SSTL)
    uint256 public totalTokensForSale;
    uint256 public tokensSold;

    // Buyer data
    struct VestingSchedule {
        uint256 totalTokens; // Total tokens purchased
        uint256 claimedTokens; // Tokens already claimed
        uint256 vestingStart; // When vesting begins (sale end time)
        bool exists;
    }

    mapping(address => VestingSchedule) public vestingSchedules;
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
        uint256 saleStart,
        uint256 saleEnd,
        uint256 tokenPrice,
        uint256 totalTokensForSale
    );

    /**
     * @notice Initialize the sale contract
     * @param _sstlToken Address of SSTL token
     * @param _paymentToken Address of payment token (USDC, USDT, etc.)
     */
    constructor(address _sstlToken, address _paymentToken) {
        require(_sstlToken != address(0), "Invalid token address");
        require(_paymentToken != address(0), "Invalid payment token address");
        sstlToken = IERC20(_sstlToken);
        paymentToken = IERC20(_paymentToken);
    }

    /**
     * @notice Configure sale parameters
     * @param _saleStart Sale start time (unix timestamp)
     * @param _saleEnd Sale end time (unix timestamp)
     * @param _tokenPrice Price per token in payment token (e.g., 1 SSTL = 0.5 USDC)
     * @param _totalTokensForSale Total tokens available for sale
     */
    function configureSale(
        uint256 _saleStart,
        uint256 _saleEnd,
        uint256 _tokenPrice,
        uint256 _totalTokensForSale
    ) external onlyOwner {
        require(_saleStart < _saleEnd, "Invalid sale times");
        require(_tokenPrice > 0, "Price must be > 0");
        require(_totalTokensForSale > 0, "Must have tokens for sale");

        saleStart = _saleStart;
        saleEnd = _saleEnd;
        tokenPrice = _tokenPrice;
        totalTokensForSale = _totalTokensForSale;

        // Transfer tokens from owner to contract
        bool success = sstlToken.transferFrom(
            msg.sender,
            address(this),
            _totalTokensForSale
        );
        require(success, "Token transfer failed");

        emit SaleConfigured(_saleStart, _saleEnd, _tokenPrice, _totalTokensForSale);
    }

    /**
     * @notice Buy tokens during sale (tokens are locked with vesting)
     * @param _tokenAmount Amount of SSTL tokens to purchase
     */
    function buyTokens(uint256 _tokenAmount) external nonReentrant {
        require(block.timestamp >= saleStart, "Sale has not started");
        require(block.timestamp <= saleEnd, "Sale has ended");
        require(_tokenAmount > 0, "Must buy at least 1 token");
        require(tokensSold + _tokenAmount <= totalTokensForSale, "Not enough tokens available");

        uint256 cost = (_tokenAmount * tokenPrice) / 1e18; // Assuming both have 18 decimals

        // Transfer payment tokens from buyer to contract
        bool success = paymentToken.transferFrom(msg.sender, address(this), cost);
        require(success, "Payment transfer failed");

        // Add to buyer's vesting schedule
        if (!vestingSchedules[msg.sender].exists) {
            buyers.push(msg.sender);
            vestingSchedules[msg.sender].vestingStart = saleEnd;
            vestingSchedules[msg.sender].exists = true;
        }

        vestingSchedules[msg.sender].totalTokens += _tokenAmount;
        tokensSold += _tokenAmount;

        emit TokensPurchased(msg.sender, _tokenAmount, tokenPrice, cost);
    }

    /**
     * @notice Calculate claimable tokens for a buyer
     * @param _buyer Address of the buyer
     * @return Amount of tokens available to claim
     */
    function getClaimableTokens(address _buyer) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[_buyer];
        require(schedule.exists, "No vesting schedule for this address");

        // Before cliff ends: 0 tokens claimable
        if (block.timestamp < schedule.vestingStart + CLIFF_DURATION) {
            return 0;
        }

        // Calculate vested amount
        uint256 timeAfterCliff = block.timestamp - (schedule.vestingStart + CLIFF_DURATION);
        uint256 vestedAmount;

        if (timeAfterCliff >= VESTING_DURATION) {
            // All tokens vested
            vestedAmount = schedule.totalTokens;
        } else {
            // Linear vesting
            vestedAmount = (schedule.totalTokens * timeAfterCliff) / VESTING_DURATION;
        }

        // Return claimable = vested - already claimed
        return vestedAmount - schedule.claimedTokens;
    }

    /**
     * @notice Claim unlocked tokens (after cliff period)
     */
    function claimTokens() external nonReentrant {
        uint256 claimable = getClaimableTokens(msg.sender);
        require(claimable > 0, "No tokens to claim");

        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        schedule.claimedTokens += claimable;

        bool success = sstlToken.transfer(msg.sender, claimable);
        require(success, "Token transfer failed");

        emit TokensClaimed(msg.sender, claimable);
    }

    /**
     * @notice Get vesting info for a buyer
     * @param _buyer Address of the buyer
     * @return totalTokens Total tokens purchased
     * @return claimedTokens Tokens already claimed
     * @return claimableTokens Tokens available to claim now
     * @return vestingStart When vesting schedule started
     * @return nextClaimTime Estimated time for next claim opportunity
     */
    function getVestingInfo(address _buyer)
        external
        view
        returns (
            uint256 totalTokens,
            uint256 claimedTokens,
            uint256 claimableTokens,
            uint256 vestingStart,
            uint256 nextClaimTime
        )
    {
        VestingSchedule memory schedule = vestingSchedules[_buyer];
        require(schedule.exists, "No vesting schedule");

        totalTokens = schedule.totalTokens;
        claimedTokens = schedule.claimedTokens;
        claimableTokens = getClaimableTokens(_buyer);
        vestingStart = schedule.vestingStart;

        // Next claim opportunity after cliff ends
        if (block.timestamp < schedule.vestingStart + CLIFF_DURATION) {
            nextClaimTime = schedule.vestingStart + CLIFF_DURATION;
        } else {
            nextClaimTime = block.timestamp; // Can claim now
        }
    }

    /**
     * @notice Withdraw unsold tokens and payment (owner only)
     */
    function withdrawUnsoldTokens() external onlyOwner {
        uint256 unsold = totalTokensForSale - tokensSold;
        if (unsold > 0) {
            sstlToken.transfer(msg.sender, unsold);
        }
    }

    function withdrawPayments() external onlyOwner {
        uint256 balance = paymentToken.balanceOf(address(this));
        require(balance > 0, "No payment tokens to withdraw");
        paymentToken.transfer(msg.sender, balance);
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
}
