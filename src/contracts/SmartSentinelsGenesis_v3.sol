// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @dev Interface for PoUW contract to register Genesis NFT mints
 */
interface IPoUW {
    function onGenesisNFTMinted(uint256 tokenId) external;
}

contract SmartSentinelsGenesis is ERC721Enumerable, Ownable2Step, ReentrancyGuard {
    using Strings for uint256;

    uint256 private constant MAX_SUPPLY = 1000;
    uint256 private _nextTokenId = 1;

    IERC20 public paymentToken;
    bool public useNativePayment;
    uint256 public mintAmountToken;
    uint256 public mintAmountBNB;
    IPoUW public immutable pouwContract; // PoUW contract reference for mint registration

    string private _baseTokenURI;
    bool public baseURIFrozen;
    string private _contractURI;
    string public mediaBaseURI;
    string public mediaExtension;

    bool public publicMintEnabled;

    struct PayeeInfo {
        uint256 share;
        bool active;
    }

    mapping(address => PayeeInfo) public payees;
    address[] public payeeList;
    uint256 public totalShares;

    event Minted(address indexed minter, uint256 indexed tokenId, uint256 value, bool paidInNative);
    event PublicMintStatusChanged(bool indexed status);
    event BaseURIUpdated(string newBaseURI);
    event BaseURIFrozen();
    event ContractURIUpdated(string newContractURI);
    event MediaBaseURIUpdated(string newMediaBaseURI);
    event MediaExtensionUpdated(string newMediaExtension);
    event PaymentTokenUpdated(address indexed newToken, bool indexed useNative);
    event MintPricesUpdated(uint256 newTokenAmount, uint256 newBNBAmount);
    event PayeeUpdated(address indexed payee, uint256 share, bool indexed active);
    event PayeeRemoved(address indexed payee);
    event FundsWithdrawn(address indexed recipient, uint256 amount);

    constructor(
        string memory initBaseURI,
        string memory initContractURI,
        string memory initMediaBaseURI,
        address initPaymentToken,
        address _pouwContract // PoUW contract address for Genesis revenue tracking
    ) ERC721("SmartSentinels Genesis", "SSTLGEN") Ownable(msg.sender) {
        require(bytes(initBaseURI).length != 0, "BaseURI required");
        require(_pouwContract != address(0), "Invalid PoUW address");
        require(initPaymentToken != address(0), "Invalid payment token");
        
        _baseTokenURI = initBaseURI;
        _contractURI = initContractURI;
        mediaBaseURI = initMediaBaseURI;
        mediaExtension = ".mp4";
        
        pouwContract = IPoUW(_pouwContract);
        paymentToken = IERC20(initPaymentToken);

        // Set payment defaults (will use BNB)
        useNativePayment = true; // Start with BNB
        
        // Set the mint price (0.1 BNB)
        mintAmountBNB = 100000000000000000;      // 0.1 BNB
        mintAmountToken = 1000000000000000000000; // 1000 SSTL (if token payment enabled later)
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

    function publicMint() external payable nonReentrant {
        require(publicMintEnabled, "Mint off");
        require(totalSupply() < MAX_SUPPLY, "Sold out");
        require(totalShares == 10000, "Bad shares");

        uint256 amountReceived;

        if (useNativePayment) {
            require(msg.value == mintAmountBNB, "Bad BNB");
            require(msg.value != 0, "Zero pay");
            amountReceived = msg.value;
            _splitBNB(amountReceived);
        } else {
            require(msg.value == 0, "No BNB");
            require(mintAmountToken != 0, "Zero tok");
            amountReceived = mintAmountToken;
            require(paymentToken.transferFrom(msg.sender, address(this), amountReceived), "Transfer");
            _splitToken(amountReceived);
        }

        uint256 tokenId = _nextTokenId;
        unchecked { ++_nextTokenId; }
        _safeMint(msg.sender, tokenId);

        // Register this NFT mint with PoUW contract for revenue snapshot
        pouwContract.onGenesisNFTMinted(tokenId);

        emit Minted(msg.sender, tokenId, amountReceived, useNativePayment);
    }

    function ownerMint(address to) external nonReentrant onlyOwner {
        require(to != address(0), "Zero");
        require(totalSupply() < MAX_SUPPLY, "Max");
        
        uint256 tokenId = _nextTokenId;
        unchecked { ++_nextTokenId; }
        _safeMint(to, tokenId);
    }

    function _splitBNB(uint256 totalReceived) internal {
        uint256 length = payeeList.length;
        
        for (uint256 i; i < length; ) {
            address payable payee = payable(payeeList[i]);
            PayeeInfo memory info = payees[payee];

            if (info.active && info.share != 0) {
                uint256 payment = (totalReceived * info.share) / totalShares;
                if (payment != 0) {
                    (bool sent, ) = payee.call{value: payment}("");
                    require(sent, "BNB failed");
                }
            }
            unchecked { ++i; }
        }
    }

    function _splitToken(uint256 totalReceived) internal {
        uint256 length = payeeList.length;
        
        for (uint256 i; i < length; ) {
            address payee = payeeList[i];
            PayeeInfo memory info = payees[payee];

            if (info.active && info.share != 0) {
                uint256 payment = (totalReceived * info.share) / totalShares;
                if (payment != 0) {
                    require(paymentToken.transfer(payee, payment), "Token failed");
                }
            }
            unchecked { ++i; }
        }
    }

    function _addOrUpdatePayee(address payee, uint256 share, bool active) internal {
        require(payee != address(0), "Zero addr");
        require(share <= 10000, "Share>100%");

        if (payees[payee].share == 0) {
            payeeList.push(payee);
        } else {
            if (payees[payee].active) {
                totalShares -= payees[payee].share;
            }
        }

        payees[payee] = PayeeInfo({share: share, active: active});
        
        if (active) {
            totalShares += share;
        }

        require(totalShares <= 10000, "Total>100%");

        emit PayeeUpdated(payee, share, active);
    }

    function addOrUpdatePayee(address payee, uint256 share, bool active) external onlyOwner {
        _addOrUpdatePayee(payee, share, active);
    }

    function disablePayee(address payee) external onlyOwner {
        require(payees[payee].active, "Inactive");
        
        payees[payee].active = false;
        totalShares -= payees[payee].share;
        
        emit PayeeUpdated(payee, payees[payee].share, false);
    }

    function enablePayee(address payee) external onlyOwner {
        require(!payees[payee].active, "Active");
        require(payees[payee].share != 0, "No share");
        
        payees[payee].active = true;
        totalShares += payees[payee].share;
        require(totalShares <= 10000, "Total>100%");
        
        emit PayeeUpdated(payee, payees[payee].share, true);
    }

    function removePayee(address payee) external onlyOwner {
        require(payees[payee].share != 0, "Not found");
        
        if (payees[payee].active) {
            totalShares -= payees[payee].share;
        }
        
        uint256 length = payeeList.length;
        for (uint256 i; i < length; ) {
            if (payeeList[i] == payee) {
                payeeList[i] = payeeList[length - 1];
                payeeList.pop();
                break;
            }
            unchecked { ++i; }
        }
        
        delete payees[payee];
        emit PayeeRemoved(payee);
    }

    function getPayees() external view returns (address[] memory) {
        return payeeList;
    }

    function setMintPrices(uint256 newTokenAmount, uint256 newBNBAmount) external onlyOwner {
        require(newTokenAmount != 0 || newBNBAmount != 0, "Zero");
        
        mintAmountToken = newTokenAmount;
        mintAmountBNB = newBNBAmount;
        
        emit MintPricesUpdated(newTokenAmount, newBNBAmount);
    }

    function setPaymentToken(address newToken, bool native) external onlyOwner {
        require(newToken != address(0) || native, "Zero");
        
        if (!native) {
            paymentToken = IERC20(newToken);
        }
        useNativePayment = native;
        
        emit PaymentTokenUpdated(newToken, native);
    }

    function setBaseURI(string calldata newBase) external onlyOwner {
        require(!baseURIFrozen, "Frozen");
        require(bytes(newBase).length != 0, "Empty");
        
        if (keccak256(bytes(newBase)) != keccak256(bytes(_baseTokenURI))) {
            _baseTokenURI = newBase;
            emit BaseURIUpdated(newBase);
        }
    }

    function freezeBaseURI() external onlyOwner {
        require(!baseURIFrozen, "Frozen");
        
        baseURIFrozen = true;
        emit BaseURIFrozen();
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
        require(bytes(newExt).length != 0, "Empty");
        
        if (keccak256(bytes(newExt)) != keccak256(bytes(mediaExtension))) {
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

    function withdraw(address payable to) external nonReentrant onlyOwner {
        require(to != address(0), "Zero addr");
        
        uint256 balance = address(this).balance;
        require(balance != 0, "No funds");
        
        (bool success, ) = to.call{value: balance}("");
        require(success, "Send fail");
        
        emit FundsWithdrawn(to, balance);
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
        require(bytes(mediaBaseURI).length != 0, "Empty");
        return mediaBaseURI;
    }

    function tokensOfOwner(address owner_) external view returns (uint256[] memory ids) {
        uint256 count = balanceOf(owner_);
        ids = new uint256[](count);
        
        for (uint256 i; i < count; ) {
            ids[i] = tokenOfOwnerByIndex(owner_, i);
            unchecked { ++i; }
        }
    }

    receive() external payable {}
}
