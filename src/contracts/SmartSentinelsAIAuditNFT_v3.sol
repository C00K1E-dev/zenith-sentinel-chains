// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

interface IPoUW {
    function addGenesisRevenue() external payable;
}


contract SmartSentinelsAIAudit is ERC721Enumerable, Ownable2Step, ReentrancyGuard {
    using Strings for uint256;

    event Minted(address indexed minter, uint256 tokenId, uint256 value, bool paidInNative);
    event PayeeUpdated(address indexed payee, uint256 share, bool active);
    event PayeeRemoved(address indexed payee);
    event PayoutFailed(address indexed payee, uint256 amount);

    uint256 private constant MAX_SUPPLY = 1000;
    uint256 private _nextTokenId = 1;

    IERC20 public paymentToken;
    bool public useNativePayment;
    uint256 public mintAmountToken;
    uint256 public mintAmountBNB;

    string private _baseTokenURI;
    string private _contractURI;
    string public mediaBaseURI;
    bool public baseURIFrozen;
    bool public publicMintEnabled;
    struct PayeeInfo {
        uint256 share;
        bool active;
    }

    mapping(address => PayeeInfo) public payees;
    address[] public payeeList;
    uint256 public totalShares = 10000;
    
    IPoUW public pouwContract;
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
    constructor(
        string memory initBaseURI,
        string memory initContractURI,
        string memory initMediaBaseURI,
        address initPaymentToken
    ) ERC721("SmartSentinels AI Audit", "SSTLAUDIT") Ownable(msg.sender) {
        _baseTokenURI = initBaseURI;
        _contractURI = initContractURI;
        mediaBaseURI = initMediaBaseURI;
        paymentToken = IERC20(initPaymentToken);
        useNativePayment = true;
        
        mintAmountBNB = 74000000000000000;
        mintAmountToken = 1000000000000000000000;
        publicMintEnabled = true;

        totalShares = 0;
        _addOrUpdatePayee(0xb792F3217bA6C35ED8670d48fc3aFB60Ad7d7356, 1500, true);
        _addOrUpdatePayee(0x8D17d02c2E75aAB802CB4978bF0ec1251aAD511d, 200, true);
        _addOrUpdatePayee(0x9b2310b2043FD59bB1070016d1D02C976b46b0E1, 1000, true);
        _addOrUpdatePayee(0x861e3Aef66B042387F32E7Fe6887f24E3cc0D16b, 200, true);
        _addOrUpdatePayee(0x72fCEd35A613186Bf50A63c9fc2415b0Af0ACf94, 1000, true);
        _addOrUpdatePayee(0x4E21F74143660ee576F4D2aC26BD30729a849f55, 6100, true);
    }

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
            require(paymentToken.transferFrom(msg.sender, address(this), amountReceived), "Token transfer failed");
            _splitToken(amountReceived);
        }

        uint256 tokenId = _nextTokenId;
        unchecked { _nextTokenId++; }
        _safeMint(msg.sender, tokenId);

        emit Minted(msg.sender, tokenId, amountReceived, useNativePayment);
    }
    function _splitBNB(uint256 totalReceived) internal {
        uint256 length = payeeList.length;
        for (uint256 i = 0; i < length; ) {
            address payable payee = payable(payeeList[i]);
            PayeeInfo memory info = payees[payee];

            if (info.active && info.share > 0) {
                uint256 payment = (totalReceived * info.share) / totalShares;
                if (payment > 0) {
                    if (_isPoUWContract(payee)) {
                        try IPoUW(payee).addGenesisRevenue{value: payment}() {
                        } catch {
                            emit PayoutFailed(payee, payment);
                        }
                    } else {
                        (bool sent, ) = payee.call{value: payment}("");
                        if (!sent) {
                            emit PayoutFailed(payee, payment);
                        }
                    }
                }
            }
            unchecked { ++i; }
        }
    }

    function setPouwContract(address _pouwContract) external onlyOwner {
        require(_pouwContract != address(0), "Invalid PoUW contract");
        pouwContract = IPoUW(_pouwContract);
    }
    function _isPoUWContract(address target) internal view returns (bool) {
        return (address(pouwContract) != address(0) && target == address(pouwContract));
    }

    function _splitToken(uint256 totalReceived) internal {
        uint256 length = payeeList.length;
        for (uint256 i = 0; i < length; ) {
            address payee = payeeList[i];
            PayeeInfo memory info = payees[payee];

            if (info.active && info.share > 0) {
                uint256 payment = (totalReceived * info.share) / totalShares;
                require(paymentToken.transfer(payee, payment), "Token Payout failed");
            }
            unchecked { ++i; }
        }
    }

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
        
        uint256 length = payeeList.length;
        for (uint256 i = 0; i < length; ) {
            if (payeeList[i] == payee) {
                payeeList[i] = payeeList[payeeList.length - 1];
                payeeList.pop();
                break;
            }
            unchecked { ++i; }
        }
        delete payees[payee];
        emit PayeeRemoved(payee);
    }



    function setMintPrices(uint256 newTokenAmount, uint256 newBNBAmount) external onlyOwner {
        mintAmountToken = newTokenAmount;
        mintAmountBNB = newBNBAmount;
    }

    function setPaymentToken(address newToken, bool native) external onlyOwner {
        require(newToken != address(0) || native == true, "Token required for non-native payment");
        paymentToken = IERC20(newToken);
        useNativePayment = native;
    }

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

    function tokensOfOwner(address owner_) external view returns (uint256[] memory ids) {
        uint256 count = balanceOf(owner_);
        ids = new uint256[](count);
        for (uint256 i = 0; i < count; ) {
            ids[i] = tokenOfOwnerByIndex(owner_, i);
            unchecked { ++i; }
        }
    }
    function setBaseURI(string calldata newBase) external onlyOwner {
        require(!baseURIFrozen, "Base URI frozen");
        _baseTokenURI = newBase;
    }

    function freezeBaseURI() external onlyOwner {
        baseURIFrozen = true;
    }

    function setContractURI(string calldata newContractURI) external onlyOwner {
        _contractURI = newContractURI;
    }

    function setMediaBaseURI(string calldata newMediaBaseURI) external onlyOwner {
        mediaBaseURI = newMediaBaseURI;
    }

    function setPublicMintEnabled(bool enabled) external onlyOwner {
        publicMintEnabled = enabled;
    }


    function withdraw(address payable to, uint256 amount) external onlyOwner nonReentrant {
        require(address(this).balance > 0, "No funds to withdraw");
        require(to != address(0), "Cannot withdraw to zero address");
        require(amount > 0 && amount <= address(this).balance, "Invalid amount");
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "Withdraw failed");
    }
    
    receive() external payable {}
}
