# SmartSentinels Genesis NFT Verification API

## Overview
This API endpoint verifies if a wallet address has minted a SmartSentinels Genesis NFT on the Binance Smart Chain (BSC).

---

## API Information for Micro3 Integration

### Endpoint
```
https://smartsentinels.net/api/verify-genesis-mint
```

### Network
- **Blockchain**: Binance Smart Chain (BSC)
- **Chain ID**: 56
- **Contract Address**: `0x6427f3C265E47BABCde870bcC4F71d1c4A12779b`

### Supported Methods
- `GET` - Pass wallet address as query parameter
- `POST` - Pass wallet address in request body

---

## Request Format

### GET Request
```
GET https://smartsentinels.net/api/verify-genesis-mint?walletAddress=<WALLET_ADDRESS>
```

### POST Request
```
POST https://smartsentinels.net/api/verify-genesis-mint
Content-Type: application/json

{
  "walletAddress": "0x..."
}
```

### Parameters
| Parameter | Type | Required | Aliases | Description |
|-----------|------|----------|---------|-------------|
| `walletAddress` | string | Yes | `wallet`, `address` | Ethereum/BSC wallet address to verify |

**Note**: The API accepts multiple parameter names for flexibility:
- `walletAddress` (primary)
- `wallet`
- `address`

---

## Response Format

### Success Response (User has Genesis NFT)
**HTTP Status**: 200
```json
{
  "success": true,
  "data": {
    "verified": true,
    "eligible": true,
    "walletAddress": "0x742d35cc6634c0532925a3b844bc9e7595f0beb",
    "nftBalance": "1",
    "details": {
      "contractAddress": "0x6427f3C265E47BABCde870bcC4F71d1c4A12779b",
      "message": "User owns 1 Genesis NFT",
      "timestamp": "2025-12-04T09:16:02.805Z",
      "network": "BSC",
      "chainId": 56
    }
  }
}
```

### Success Response (User does NOT have Genesis NFT)
**HTTP Status**: 200
```json
{
  "success": true,
  "data": {
    "verified": false,
    "eligible": false,
    "walletAddress": "0x0000000000000000000000000000000000000001",
    "nftBalance": "0",
    "details": {
      "contractAddress": "0x6427f3C265E47BABCde870bcC4F71d1c4A12779b",
      "message": "User does not own any Genesis NFTs",
      "timestamp": "2025-12-04T09:16:02.805Z",
      "network": "BSC",
      "chainId": 56
    }
  }
}
```

### Error Response (Invalid Wallet Address)
**HTTP Status**: 400
```json
{
  "success": false,
  "error": "Invalid wallet address format",
  "data": {
    "verified": false,
    "eligible": false,
    "walletAddress": "invalid-address",
    "nftBalance": "0"
  }
}
```

### Error Response (Missing Parameter)
**HTTP Status**: 400
```json
{
  "success": false,
  "error": "Missing or invalid walletAddress parameter",
  "data": null
}
```

### Error Response (Internal Server Error)
**HTTP Status**: 500
```json
{
  "success": false,
  "error": "Internal server error",
  "message": "Error details...",
  "data": null
}
```

---

## Response Fields

### Root Level
| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates if the API call was successful |
| `data` | object | Contains verification results (null on error) |
| `error` | string | Error message (only present on failure) |

### Data Object
| Field | Type | Description |
|-------|------|-------------|
| `verified` | boolean | **True** if user owns at least 1 Genesis NFT |
| `eligible` | boolean | Same as `verified` - indicates task completion |
| `walletAddress` | string | The wallet address that was checked (normalized) |
| `nftBalance` | string | Number of Genesis NFTs owned by the wallet |
| `details` | object | Additional information about the verification |

### Details Object
| Field | Type | Description |
|-------|------|-------------|
| `contractAddress` | string | Genesis NFT contract address on BSC |
| `message` | string | Human-readable verification result |
| `timestamp` | string | ISO 8601 timestamp of verification |
| `network` | string | Blockchain network (always "BSC") |
| `chainId` | number | Chain ID (always 56 for BSC Mainnet) |

---

## Integration Examples

### JavaScript (Fetch API)
```javascript
// Check if a wallet has minted Genesis NFT
async function checkGenesisMint(walletAddress) {
  const url = `https://smartsentinels.net/api/verify-genesis-mint?walletAddress=${walletAddress}`;
  
  const response = await fetch(url);
  const result = await response.json();
  
  if (result.success && result.data.verified) {
    console.log(`✅ User has ${result.data.nftBalance} Genesis NFT(s)`);
    return true;
  } else {
    console.log('❌ User has not minted Genesis NFT');
    return false;
  }
}

// Usage
checkGenesisMint('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
```

### cURL
```bash
# GET request
curl -X GET "https://smartsentinels.net/api/verify-genesis-mint?walletAddress=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"

# POST request
curl -X POST "https://smartsentinels.net/api/verify-genesis-mint" \
  -H "Content-Type: application/json" \
  -d '{"walletAddress":"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'
```

### Python
```python
import requests

def check_genesis_mint(wallet_address):
    url = "https://smartsentinels.net/api/verify-genesis-mint"
    params = {"walletAddress": wallet_address}
    
    response = requests.get(url, params=params)
    result = response.json()
    
    if result.get("success") and result.get("data", {}).get("verified"):
        print(f"✅ User has {result['data']['nftBalance']} Genesis NFT(s)")
        return True
    else:
        print("❌ User has not minted Genesis NFT")
        return False

# Usage
check_genesis_mint("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
```

---

## Testing

### Test Wallets
You can test the API with these example addresses:

1. **Wallet WITHOUT NFT**:
   ```
   0x0000000000000000000000000000000000000001
   ```
   Expected: `verified: false`

2. **Your test wallet**:
   Replace with an actual wallet that has minted Genesis NFT for positive testing.

### Live Test
Open this URL in your browser:
```
https://smartsentinels.net/api/verify-genesis-mint?walletAddress=0x0000000000000000000000000000000000000001
```

---

## Rate Limiting & Performance

- **No rate limiting** currently implemented
- **Response time**: Typically < 1 second
- **Blockchain**: Queries BSC directly via RPC
- **Caching**: Not currently implemented (real-time verification)

---

## CORS & Security

- **CORS**: Enabled for all origins (`*`)
- **HTTPS**: Required (uses SSL/TLS)
- **API Key**: Not required
- **Authentication**: Not required

---

## Task Completion Logic for Micro3

**Task is completed when**:
- `success === true`
- `data.verified === true`
- `data.nftBalance > 0`

**Reward Eligibility**:
Use the `data.eligible` field, which mirrors `data.verified`.

---

## Support

For technical support or questions:
- **Website**: https://www.smartsentinels.net/
- **Twitter**: https://x.com/SmartSentinels_
- **Telegram**: https://t.me/SmartSentinelsCommunity

---

## Additional Information

### Contract Details
- **Contract Type**: ERC-721 (NFT)
- **Token Standard**: NFT
- **Supply**: Limited Genesis collection
- **Mint Location**: https://smartsentinels.net/hub/nfts

### Smart Contract Verification
You can verify the contract on BSCScan:
```
https://bscscan.com/address/0x6427f3C265E47BABCde870bcC4F71d1c4A12779b
```

---

**Last Updated**: December 4, 2025  
**API Version**: 1.0  
**Status**: ✅ Production Ready
