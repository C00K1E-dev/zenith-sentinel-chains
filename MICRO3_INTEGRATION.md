# SmartSentinels x Micro3 - API Integration

## On-Chain Task Verification API

### API Endpoint
```
https://smartsentinels.net/api/verify-genesis-mint
```

### Task: Mint Genesis NFT
- **Title**: Mint Genesis NFT
- **Type**: On-chain Action
- **Description**: Explore and mint exclusive SmartSentinels collections
- **Direct Link**: https://smartsentinels.net/hub/nfts
- **Reward**: 20 Red Envelopes

---

## API Documentation

### Request
**Method**: GET or POST

**Parameters**:
- `walletAddress` (string, required) - User's BSC wallet address

**Example GET Request**:
```
https://smartsentinels.net/api/verify-genesis-mint?walletAddress=0x9b2310b2043fd59bb1070016d1d02c976b46b0e1
```

**Example POST Request**:
```bash
POST https://smartsentinels.net/api/verify-genesis-mint
Content-Type: application/json

{
  "walletAddress": "0x9b2310b2043fd59bb1070016d1d02c976b46b0e1"
}
```

---

### Response Format

#### Task Completed (User owns Genesis NFT)
```json
{
  "success": true,
  "data": {
    "verified": true,
    "eligible": true,
    "walletAddress": "0x9b2310b2043fd59bb1070016d1d02c976b46b0e1",
    "nftBalance": "1",
    "details": {
      "contractAddress": "0x6427f3C265E47BABCde870bcC4F71d1c4A12779b",
      "message": "User owns 1 Genesis NFT",
      "timestamp": "2025-12-04T09:20:41.590Z",
      "network": "BSC",
      "chainId": 56
    }
  }
}
```

#### Task NOT Completed (User doesn't own Genesis NFT)
```json
{
  "success": true,
  "data": {
    "verified": false,
    "eligible": false,
    "walletAddress": "0x...",
    "nftBalance": "0",
    "details": {
      "message": "User does not own any Genesis NFTs",
      "network": "BSC",
      "chainId": 56
    }
  }
}
```

---

## Task Completion Logic

**User completes the task when**:
```javascript
response.success === true && 
response.data.verified === true && 
parseInt(response.data.nftBalance) > 0
```

Or simply check:
```javascript
response.data.eligible === true
```

---

## Technical Details

- **Blockchain**: Binance Smart Chain (BSC)
- **Chain ID**: 56
- **Contract Address**: `0x6427f3C265E47BABCde870bcC4F71d1c4A12779b`
- **Contract Type**: ERC-721 (NFT)
- **Verification Method**: Real-time on-chain balance check

### Wallet Eligibility
Any wallet that owns at least 1 SmartSentinels Genesis NFT from the contract above.

---

## Testing

### Live Test URL
```
https://smartsentinels.net/api/verify-genesis-mint?walletAddress=0x9b2310b2043fd59bb1070016d1d02c976b46b0e1
```

### Test Wallets
- **With NFT**: `0x9b2310b2043fd59bb1070016d1d02c976b46b0e1` (verified ✅)
- **Without NFT**: `0x0000000000000000000000000000000000000001`

---

## Additional Information

### Features
- ✅ Real-time blockchain verification
- ✅ CORS enabled for all origins
- ✅ No authentication required
- ✅ No rate limiting
- ✅ Response time < 1 second

### Error Handling
Invalid requests return:
```json
{
  "success": false,
  "error": "Error message here",
  "data": null
}
```

---

## Support

- **Website**: https://www.smartsentinels.net/
- **Twitter**: https://x.com/SmartSentinels_
- **Telegram**: https://t.me/SmartSentinelsCommunity

---

**Status**: ✅ Production Ready  
**Last Updated**: December 4, 2025
