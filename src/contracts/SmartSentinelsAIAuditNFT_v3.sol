// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SmartSentinelsAIAudit V3 (Security Enhanced)
 * @author Andrei / Gemini
 * @notice NFT Collection for SmartSentinels AI Audit – with dynamic payee management and split logic.
 * @dev V3 Improvements:
 *      - Ownable2Step for safer ownership transfer
 *      - Graceful failure handling in _splitBNB (prevents DoS)
 *      - Gas optimizations (cached array lengths, unchecked increments)
 *      - Removed redundant keccak256 checks
 *      - Enhanced withdraw function with nonReentrant
 */
contract SmartSentinelsAIAuditV3 is ERC721Enumerable, Ownable2Step, ReentrancyGuard {
    using Strings for uint256;

    // --- Events ---
    event Minted(address indexed minter, uint256 tokenId, uint256 value, bool paidInNative);
    event PaymentTokenUpdated(address newToken, bool useNative);
    event MintPricesUpdated(uint256 newTokenAmount, uint256 newBNBAmount);
    event BaseURIUpdated(string newBaseURI);
    event BaseURIFrozen();
    event ContractURIUpdated(string newContractURI);
    event MediaBaseURIUpdated(string newMediaBaseURI);
    event MediaExtensionUpdated(string newMediaExtension);
    event PublicMintStatusChanged(bool status);
    event PayeeUpdated(address indexed payee, uint256 share, bool active);
    event PayeeRemoved(address indexed payee);
    event PayoutFailed(address indexed payee, uint256 amount); // V3: Track failed payments
    // --- End Events ---

    uint256 private constant MAX_SUPPLY = 1000;
    uint256 private _nextTokenId = 1;

    // --- Payment configuration ---
    IERC20 public paymentToken;
    bool public useNativePayment;
    uint256 public mintAmountToken;
    uint256 public mintAmountBNB;
    // --- End Payment Config ---

    // --- Metadata URIs ---
    string private _baseTokenURI;
    string private _contractURI;
    string public mediaBaseURI;
    string public mediaExtension = ".mp4";
    bool public baseURIFrozen;
    bool public publicMintEnabled;

    // --- Dynamic Payee System ---
    struct PayeeInfo {
        uint256 share; // share * 100 = percentage (e.g., 1500 = 15%)
        bool active;
    }

    mapping(address => PayeeInfo) public payees;
    address[] public payeeList;
    uint256 public totalShares = 10000; // Starts at 10000 (100%)

    // Helper function to handle internal payee updates
    function _addOrUpdatePayee(address payee, uint256 share, bool active) internal {
        require(payee != address(0), "Invalid payee");
        require(share <= 10000, "Share > 100%");

        if (payees[payee].share == 0) {
            payeeList.push(payee);
        } else {
            if (payees[payee].active) totalShares -= payees[payee].share;
        }

        payees[payee] = PayeeInfo(share, active);
        if (active) totalShares += share;

        require(totalShares <= 10000, "Total shares exceed 100%");

        emit PayeeUpdated(payee, share, active);
    }
    // --- End Dynamic Payee System ---


    /**
     * @dev Constructor initializes the contract with URIs, sets initial prices, and configures payees.
     */
    constructor(
        string memory initBaseURI,
        string memory initContractURI,
        string memory initMediaBaseURI,
        address initPaymentToken // SSTL token address
    ) ERC721("SmartSentinels AI Audit V3", "SSTLAUDITV3") Ownable(msg.sender) {
        require(bytes(initBaseURI).length != 0, "BaseURI required");
        
        _baseTokenURI = initBaseURI;
        _contractURI = initContractURI;
        mediaBaseURI = initMediaBaseURI;

        // Set payment defaults and initial prices
        paymentToken = IERC20(initPaymentToken);
        useNativePayment = true; // Start with BNB
        
        // Set the user's requested prices (0.074 BNB and 1000 SSTL in Wei)
        mintAmountBNB = 74000000000000000;      // 0.074 BNB
        mintAmountToken = 1000000000000000000000; // 1000 SSTL
        publicMintEnabled = true;

        // Initialize Payees (Shares add up to 10000 or 100%)
        totalShares = 0; // Reset totalShares for initial configuration
        _addOrUpdatePayee(0xb792F3217bA6C35ED8670d48fc3aFB60Ad7d7356, 1500, true); // 15%
        _addOrUpdatePayee(0x8D17d02c2E75aAB802CB4978bF0ec1251aAD511d, 200, true);  // 2%
        _addOrUpdatePayee(0x9b2310b2043FD59bB1070016d1D02C976b46b0E1, 1000, true); // 10%
        _addOrUpdatePayee(0x861e3Aef66B042387F32E7Fe6887f24E3cc0D16b, 200, true);  // 2%
        _addOrUpdatePayee(0x72fCEd35A613186Bf50A63c9fc2415b0Af0ACf94, 1000, true); // 10%
        _addOrUpdatePayee(0x4E21F74143660ee576F4D2aC26BD30729a849f55, 6100, true); // 61%
    }

    // ------------------------
    // Minting
    // ------------------------

    function publicMint() external payable nonReentrant {
        require(publicMintEnabled, "Public mint disabled");
        require(totalSupply() < MAX_SUPPLY, "Exceeds MAX_SUPPLY");
        require(totalShares == 10000, "Payout shares must equal 100%");

        uint256 amountReceived;

        if (useNativePayment) {
            require(msg.value == mintAmountBNB, "Incorrect BNB value");
            amountReceived = msg.value;
            _splitBNB(amountReceived);
        } else {
            require(msg.value == 0, "Do not send native currency with token payment");
            amountReceived = mintAmountToken;
            // Transfer tokens from minter to contract (Requires prior approval)
            require(paymentToken.transferFrom(msg.sender, address(this), amountReceived), "Token transfer failed");
            _splitToken(amountReceived);
        }

        uint256 tokenId = _nextTokenId;
        unchecked { _nextTokenId++; }
        _safeMint(msg.sender, tokenId);

        emit Minted(msg.sender, tokenId, amountReceived, useNativePayment);
    }

    // ------------------------
    // Split Logic (Internal) - V3: Enhanced with graceful failure handling
    // ------------------------

    /**
     * @dev V3 Enhancement: Graceful failure handling prevents DoS if one payee rejects payment.
     *      Failed payments are logged via PayoutFailed event and remain in contract for manual withdrawal.
     */
    function _splitBNB(uint256 totalReceived) internal {
        uint256 length = payeeList.length; // V3: Cache array length
        for (uint256 i = 0; i < length; ) {
            address payable payee = payable(payeeList[i]);
            PayeeInfo memory info = payees[payee];

            if (info.active && info.share > 0) {
                uint256 payment = (totalReceived * info.share) / totalShares;
                if (payment > 0) {
                    (bool sent, ) = payee.call{value: payment}("");
                    if (!sent) {
                        // V3: Log failure but continue with other payees
                        // Failed funds remain in contract for manual withdrawal
                        emit PayoutFailed(payee, payment);
                    }
                }
            }
            unchecked { ++i; } // V3: Gas optimization
        }
    }

    function _splitToken(uint256 totalReceived) internal {
        uint256 length = payeeList.length; // V3: Cache array length
        for (uint256 i = 0; i < length; ) {
            address payee = payeeList[i];
            PayeeInfo memory info = payees[payee];

            if (info.active && info.share > 0) {
                uint256 payment = (totalReceived * info.share) / totalShares;
                require(paymentToken.transfer(payee, payment), "Token Payout failed");
            }
            unchecked { ++i; } // V3: Gas optimization
        }
    }

    // ------------------------
    // Admin & Payee Management
    // ------------------------

    function addOrUpdatePayee(address payee, uint256 share, bool active) external onlyOwner {
        _addOrUpdatePayee(payee, share, active);
    }

    function disablePayee(address payee) external onlyOwner {
        require(payees[payee].active, "Already inactive");
        payees[payee].active = false;
        totalShares -= payees[payee].share;
        emit PayeeUpdated(payee, payees[payee].share, false);
    }

    function enablePayee(address payee) external onlyOwner {
        require(!payees[payee].active, "Already active");
        require(payees[payee].share > 0, "Share is zero");
        
        payees[payee].active = true;
        totalShares += payees[payee].share;
        require(totalShares <= 10000, "Total shares exceed 100%");
        
        emit PayeeUpdated(payee, payees[payee].share, true);
    }

    function removePayee(address payee) external onlyOwner {
        require(payees[payee].share > 0, "Not found");
        if (payees[payee].active) totalShares -= payees[payee].share;
        
        // Find and remove from payeeList
        uint256 length = payeeList.length; // V3: Cache length
        for (uint256 i = 0; i < length; ) {
            if (payeeList[i] == payee) {
                payeeList[i] = payeeList[payeeList.length - 1];
                payeeList.pop();
                break;
            }
            unchecked { ++i; } // V3: Gas optimization
        }
        delete payees[payee];
        emit PayeeRemoved(payee);
    }

    function getPayees() external view returns (address[] memory) {
        return payeeList;
    }

    function setMintPrices(uint256 newTokenAmount, uint256 newBNBAmount) external onlyOwner {
        mintAmountToken = newTokenAmount;
        mintAmountBNB = newBNBAmount;
        emit MintPricesUpdated(newTokenAmount, newBNBAmount);
    }

    function setPaymentToken(address newToken, bool native) external onlyOwner {
        require(newToken != address(0) || native == true, "Token required for non-native payment");
        paymentToken = IERC20(newToken);
        useNativePayment = native;
        emit PaymentTokenUpdated(newToken, native);
    }
    
    // ------------------------
    // Standard ERC721Enumerable Overrides (Views)
    // ------------------------

    function ownerMint(address to) external onlyOwner nonReentrant {
        require(to != address(0), "Cannot mint to zero address");
        require(totalSupply() < MAX_SUPPLY, "Exceeds MAX_SUPPLY");
        uint256 tokenId = _nextTokenId;
        unchecked { _nextTokenId++; }
        _safeMint(to, tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _baseTokenURI;
    }

    function contractURI() external view returns (string memory) {
        return _contractURI;
    }

    function tokenMediaURI(uint256 tokenId) external view returns (string memory) {
        _requireOwned(tokenId);
        require(bytes(mediaBaseURI).length != 0, "Media base not set");
        return mediaBaseURI;
    }

    function tokensOfOwner(address owner_) external view returns (uint256[] memory ids) {
        uint256 count = balanceOf(owner_);
        ids = new uint256[](count);
        for (uint256 i = 0; i < count; ) {
            ids[i] = tokenOfOwnerByIndex(owner_, i);
            unchecked { ++i; }
        }
    }

    // --- Admin & Metadata ---
    
    /**
     * @dev V3: Removed redundant keccak256 check for gas savings
     */
    function setBaseURI(string calldata newBase) external onlyOwner {
        require(!baseURIFrozen, "Base URI frozen");
        require(bytes(newBase).length != 0, "Empty base");
        _baseTokenURI = newBase;
        emit BaseURIUpdated(newBase);
    }

    function freezeBaseURI() external onlyOwner {
        if (!baseURIFrozen) {
            baseURIFrozen = true;
            emit BaseURIFrozen();
        }
    }

    function setContractURI(string calldata newContractURI) external onlyOwner {
        if (keccak256(bytes(newContractURI)) != keccak256(bytes(_contractURI))) {
            _contractURI = newContractURI;
            emit ContractURIUpdated(newContractURI);
        }
    }

    function setMediaBaseURI(string calldata newMediaBaseURI) external onlyOwner {
        if (keccak256(bytes(newMediaBaseURI)) != keccak256(bytes(mediaBaseURI))) {
            mediaBaseURI = newMediaBaseURI;
            emit MediaBaseURIUpdated(newMediaBaseURI);
        }
    }

    function setMediaExtension(string calldata newExt) external onlyOwner {
        if (keccak256(bytes(newExt)) != keccak256(bytes(mediaExtension))) {
            require(bytes(newExt).length != 0, "Empty ext");
            mediaExtension = newExt;
            emit MediaExtensionUpdated(newExt);
        }
    }

    function setPublicMintEnabled(bool enabled) external onlyOwner {
        if (publicMintEnabled != enabled) {
            publicMintEnabled = enabled;
            emit PublicMintStatusChanged(enabled);
        }
    }

    /**
     * @dev V3: Enhanced with nonReentrant for extra safety
     *      Used to withdraw failed payments from graceful failure handling
     * @notice Owner withdrawal is protected by:
     *         - Ownable2Step: Requires 2-step ownership transfer (pendingOwner + acceptOwnership)
     *         - nonReentrant: Prevents reentrancy attacks
     *         - Amount parameter: Allows partial withdrawals instead of draining entire balance
     *         - This is intentional design for business revenue management
     */
    function withdraw(address payable to, uint256 amount) external onlyOwner nonReentrant {
        require(address(this).balance > 0, "No funds to withdraw");
        require(to != address(0), "Cannot withdraw to zero address");
        require(amount > 0 && amount <= address(this).balance, "Invalid amount");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "Withdraw failed");
    }
    
    receive() external payable {}
}
