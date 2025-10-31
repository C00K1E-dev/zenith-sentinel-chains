1 Deploy token  0x5cf5e1b859E892F29cEEf8B1A536A54aAe54AFc7

2 Deploy PoUW contract 0x7bab7Cc6c1E7D0f9981C55627A47310c56d8a4A7
CONSTRUCTORS :
_sstlToken:
0x5cf5e1b859E892F29cEEf8B1A536A54aAe54AFc7
_genesisCollection:
0x0000000000000000000000000000000000000001 (change later when genesis contract is deployed )
_treasuryWallet:
0x17AEC1Fe4397a1b55FeFE66C5Ec883b780a7Fa82
_serviceOwner:
0x46e451d555ebCB4ccE5087555a07F6e69D017b05
_burnAddress:
0x000000000000000000000000000000000000dEaD
admin:
0x53FF3FB6f8CFb648626F8179856FA7f38A2e3DeB
  

3 Deploy Genesis contract 0x8660373DaEc7D6A19b2EBeEEe28311764280CD8F ✅
CONSTRUCTORS :
initBaseURI:
"https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafkreibkuuv5ni6kzvhwatz7wqptix7cnjb2tzdxi2mwbsdsdmeo2ldnfy"
initContractURI:
"https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafkreidhoa6uvk2wh7sori77ypzl432pe6pscghwzxvvqxgt6saeewtjdq"
initMediaBaseURI:
"https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafybeiflizaesh5mzqakmkz33jyfsamisnv3cxb772sfsdsj2q5qwdj334"
initPaymentToken:
0x5cf5e1b859E892F29cEEf8B1A536A54aAe54AFc7 (TOKEN ADDRESS)
_pouwContract:
0x7bab7Cc6c1E7D0f9981C55627A47310c56d8a4A7 (PoUW ADDRESS)

4 🚨 CRITICAL: Update PoUW Contract with Real Genesis Address ✅
Call setGenesisContract() on PoUW contract (0x7bab7Cc6c1E7D0f9981C55627A47310c56d8a4A7)
Parameter: 0x8660373DaEc7D6A19b2EBeEEe28311764280CD8F
TX: 0x4570ca0b0a2788d8eaffaee76228aaca2ed859fca666821f03b20273036066f7

5 Deploy AI Audit NFT Contract 0x87Ea1D0509A88610e62d2E680d533CF1E750082e ✅
CONSTRUCTORS:
initBaseURI: "https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafkreifjhcmcs7z2abcfxxjvzov7uo52gt77zzg5sm2afkgmltgvgljpfi"
initContractURI: "https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafkreigqgaftcbindkqivwul6jx5xy55b5qdvjos4mvxbzj4mtysvhwqsi"
initMediaBaseURI: "https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/bafybeidamro3q34rfekck2w7bh5vskhkxpado6fcoeamglhmrgd4ervn6i"
initPaymentToken: 0x5cf5e1b859E892F29cEEf8B1A536A54aAe54AFc7

6 🚨 CRITICAL: Link AI Audit to PoUW Contract ✅
Call setPouwContract() on AI Audit contract (0x87Ea1D0509A88610e62d2E680d533CF1E750082e)
Parameter: 0x7bab7Cc6c1E7D0f9981C55627A47310c56d8a4A7
TX: 0x8cf1b786b6b6dd44fc52e4e5d7b253e4df47c68765d3f7eb5e4ddfca08593fde

7 Deploy Gateway Contract 0xa770c37079534b1a2873267D47a0970b364e64df ✅
CONSTRUCTORS:
_sstlToken: 0x5cf5e1b859E892F29cEEf8B1A536A54aAe54AFc7
_paymentToken: 0x5cf5e1b859E892F29cEEf8B1A536A54aAe54AFc7
_nftCollection: 0x87Ea1D0509A88610e62d2E680d533CF1E750082e
_pouwContract: 0x7bab7Cc6c1E7D0f9981C55627A47310c56d8a4A7
_treasuryWallet: 0x17AEC1Fe4397a1b55FeFE66C5Ec883b780a7Fa82
_serviceOwner: 0x46e451d555ebCB4ccE5087555a07F6e69D017b05
admin: 0x53FF3FB6f8CFb648626F8179856FA7f38A2e3DeB

8 🚨 ROLE PERMISSIONS - Execute in this order:

Step 8a) Grant MCP_OPERATOR_ROLE to Gateway on SSTL Token Contract
Contract: 0x5cf5e1b859E892F29cEEf8B1A536A54aAe54AFc7
Function: grantRole(bytes32 role, address account)
role: 0xb2b79e21bd6877b2d65bf60cc9e0674084ef1b390eab9bf4621eaeb12d01f1c2 (MCP_OPERATOR_ROLE)
account: 0xa770c37079534b1a2873267D47a0970b364e64df

Step 8b) Grant GATEWAY_ROLE to Gateway on PoUW Contract  
Contract: 0x7bab7Cc6c1E7D0f9981C55627A47310c56d8a4A7
Function: grantRole(bytes32 role, address account)
role: 0xb90e9995c6170fff8ea03e9ad6919878e483770c237f1a6f330ceaa7112b344a (GATEWAY_ROLE)
account: 0xa770c37079534b1a2873267D47a0970b364e64df

Step 8c) Register AI Audit Collection on PoUW Contract
Contract: 0x7bab7Cc6c1E7D0f9981C55627A47310c56d8a4A7
Function: registerCollection(address collection)
collection: 0x87Ea1D0509A88610e62d2E680d533CF1E750082e

Step 8d) Configure Gateway Payment Settings ✅
Contract: 0xa770c37079534b1a2873267D47a0970b364e64df
Function: setPaymentConfig(uint256 bnbAmount, uint256 tokenAmount, bool _acceptBNB, bool _acceptToken)
bnbAmount: 100000000000000000 (0.1 BNB)
tokenAmount: 0 
_acceptBNB: true
_acceptToken: false

9 Final Steps for Full Functionality:

Step 9a) Add PoUW Contract as Payee in AI Audit NFT (for Genesis Revenue)
Contract: 0x87Ea1D0509A88610e62d2E680d533CF1E750082e
Function: addOrUpdatePayee(address payee, uint256 share, bool active)
payee: 0x4E21F74143660ee576F4D2aC26BD30729a849f55 (PoUW Contract)
share: 5100 (10% for Genesis revenue)
active: true
payee: 0x7bab7Cc6c1E7D0f9981C55627A47310c56d8a4A7 (PoUW Contract)
share: 1000 (10% for Genesis revenue)
active: true

Step 9b) Update Frontend with New Contract Addresses ✅
Updated contracts/index.ts with all new deployment addresses:
- SSTL Token: 0x5cf5e1b859E892F29cEEf8B1A536A54aAe54AFc7
- PoUW Contract: 0x7bab7Cc6c1E7D0f9981C55627A47310c56d8a4A7  
- Genesis NFT: 0x8660373DaEc7D6A19b2EBeEEe28311764280CD8F
- AI Audit NFT: 0x87Ea1D0509A88610e62d2E680d533CF1E750082e
- Gateway: 0xa770c37079534b1a2873267D47a0970b364e64df

Step 9c) Test System Integration
- Try minting Genesis NFT (frontend should use new contract)
- Try minting AI Audit NFT (should distribute 10% to Genesis holders)
- Try submitting audit job via Gateway (should work with new addresses)
- Verify Genesis holders can claim BNB rewards
- Check My NFTs, My Rewards, General Stats with new contracts

10 READY FOR TESTING! 🚀 
