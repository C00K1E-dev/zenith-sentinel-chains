// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title SmartSentinels AI Audit Agent Gateway
 * @author Andrei
 * @notice Handles payments (BNB or SSTL) for AI audit tasks and triggers PoUW minting.
 */
interface ISSTLToken {
    function mintPoUW(address to, uint256 amount) external;
}

contract AIAuditAgentGateway is AccessControl {
    // -----------------------------------------
    // Roles
    // -----------------------------------------
    bytes32 public constant MCP_OPERATOR_ROLE = keccak256("MCP_OPERATOR_ROLE");

    // -----------------------------------------
    // Configuration
    // -----------------------------------------
    IERC20 public sstlToken;                // SSTL token (for token payments)
    ISSTLToken public sstlTokenContract;    // SSTL contract (for PoUW minting)
    address public pouwPool;                // PoUW token distribution pool
    address public serviceOwner;             // Your operational wallet

    bool public useNativePayment = true;     // Default: BNB payments
    uint256 public servicePriceBNB = 0.1 ether;      // 0.1 BNB per audit
    uint256 public servicePriceSSTL = 1000 * 10**18; // 1000 SSTL per audit (if enabled)

    uint256 public constant REWARD_PER_JOB = 67 * 10**18; // 67 SSTL minted to PoUW pool

    // -----------------------------------------
    // Events
    // -----------------------------------------
    event TaskStarted(address indexed user, uint256 amountPaid, bool paidInBNB);
    event PoUWMinted(address indexed pool, uint256 amount);
    event PaymentReceived(address indexed user, uint256 amount, bool paidInBNB);
    event PaymentModeChanged(bool nativeMode);
    event ServicePricesUpdated(uint256 newBNBPrice, uint256 newSSTLPrice);
    event ServiceOwnerUpdated(address newOwner);

    // -----------------------------------------
    // Constructor
    // -----------------------------------------
    constructor(
        address _sstlToken,
        address _sstlTokenContract,
        address _pouwPool,
        address _serviceOwner
    ) {
        require(_sstlToken != address(0), "Invalid SSTL token");
        require(_sstlTokenContract != address(0), "Invalid SSTL contract");
        require(_pouwPool != address(0), "Invalid PoUW pool");
        require(_serviceOwner != address(0), "Invalid owner");

        sstlToken = IERC20(_sstlToken);
        sstlTokenContract = ISSTLToken(_sstlTokenContract);
        pouwPool = _pouwPool;
        serviceOwner = _serviceOwner;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // -----------------------------------------
    // Core Logic
    // -----------------------------------------

    /**
     * @notice Pay for audit service in either BNB or SSTL.
     * @dev Still mints PoUW reward regardless of payment method.
     */
    function payAndRunAudit() external payable {
        uint256 amountPaid;

        if (useNativePayment) {
            // Pay with BNB
            require(msg.value == servicePriceBNB, "Incorrect BNB amount");
            (bool sent, ) = payable(serviceOwner).call{value: msg.value}("");
            require(sent, "BNB transfer failed");
            amountPaid = msg.value;
        } else {
            // Pay with SSTL tokens
            require(
                sstlToken.transferFrom(msg.sender, serviceOwner, servicePriceSSTL),
                "SSTL payment failed"
            );
            amountPaid = servicePriceSSTL;
        }

        emit PaymentReceived(msg.sender, amountPaid, useNativePayment);
        emit TaskStarted(msg.sender, amountPaid, useNativePayment);

        // Mint PoUW tokens to the pool (fixed reward)
        sstlTokenContract.mintPoUW(pouwPool, REWARD_PER_JOB);
        emit PoUWMinted(pouwPool, REWARD_PER_JOB);
    }

    // -----------------------------------------
    // Admin Controls
    // -----------------------------------------

    function setPaymentMode(bool nativeMode) external onlyRole(DEFAULT_ADMIN_ROLE) {
        useNativePayment = nativeMode;
        emit PaymentModeChanged(nativeMode);
    }

    function updateServicePrices(uint256 newBNBPrice, uint256 newSSTLPrice)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        servicePriceBNB = newBNBPrice;
        servicePriceSSTL = newSSTLPrice;
        emit ServicePricesUpdated(newBNBPrice, newSSTLPrice);
    }

    function updateServiceOwner(address newOwner) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newOwner != address(0), "Invalid address");
        serviceOwner = newOwner;
        emit ServiceOwnerUpdated(newOwner);
    }

    function assignOperator(address operator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MCP_OPERATOR_ROLE, operator);
    }

    // -----------------------------------------
    // Safety
    // -----------------------------------------

    receive() external payable {}
}
