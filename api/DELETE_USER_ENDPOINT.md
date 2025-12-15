# Delete User API Endpoint

This endpoint needs to be implemented in your backend API to support permanent user deletion.

## Endpoint

```
DELETE /user/{wallet}/delete
```

## Headers
- `x-admin-key`: Admin authentication key
- `Content-Type`: application/json

## Parameters
- `wallet`: The wallet address of the user to delete (URL parameter)

## Response

### Success (200)
```json
{
  "success": true,
  "message": "User permanently deleted"
}
```

### Error (400/401/500)
```json
{
  "success": false,
  "error": "Error message"
}
```

## Implementation Notes

This endpoint should:
1. Verify the admin key from headers
2. Delete the user from `airdrop_registrations` table
3. Delete all user data from `airdrop_progress` table
4. Delete all pending verifications for the user
5. Delete any other associated user data
6. Return success confirmation

## Database Tables to Clean
- `airdrop_registrations` - WHERE wallet_address = {wallet}
- `airdrop_progress` - WHERE wallet_address = {wallet}
- `airdrop_pending_verifications` - WHERE wallet_address = {wallet}
- Any other tables with user data

## Example Supabase Implementation

```javascript
export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { wallet } = req.query;
    const adminKey = req.headers['x-admin-key'];
    
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Delete from all tables
    await supabase.from('airdrop_progress').delete().eq('wallet_address', wallet);
    await supabase.from('airdrop_pending_verifications').delete().eq('wallet_address', wallet);
    const { error } = await supabase.from('airdrop_registrations').delete().eq('wallet_address', wallet);
    
    if (error) throw error;

    return res.status(200).json({ success: true, message: 'User permanently deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
```
