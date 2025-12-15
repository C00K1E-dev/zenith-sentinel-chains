import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Only allow DELETE method
  if (req.method !== 'DELETE') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Verify admin key
    const adminKey = req.headers['x-admin-key'];
    const expectedAdminKey = process.env.ADMIN_KEY;

    if (!adminKey || adminKey !== expectedAdminKey) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Get wallet address from URL path segments
    // URL format: /api/user-delete/[wallet]
    const { wallet } = req.query;

    if (!wallet) {
      return res.status(400).json({ success: false, error: 'Wallet address required' });
    }

    console.log(`Attempting to permanently delete user: ${wallet}`);

    // Delete from all tables - order matters due to foreign key constraints
    
    // 1. Delete pending verifications
    const { error: verifyError } = await supabase
      .from('airdrop_pending_verifications')
      .delete()
      .eq('wallet_address', wallet);

    if (verifyError) {
      console.error('Error deleting verifications:', verifyError);
    }

    // 2. Delete user progress/tasks
    const { error: progressError } = await supabase
      .from('airdrop_user_progress')
      .delete()
      .eq('wallet_address', wallet);

    if (progressError) {
      console.error('Error deleting progress:', progressError);
    }

    // 3. Delete NFT holder records
    const { error: nftError } = await supabase
      .from('airdrop_nft_holders')
      .delete()
      .eq('wallet_address', wallet);

    if (nftError) {
      console.error('Error deleting NFT records:', nftError);
    }

    // 4. Finally, delete the registration (main record)
    const { error: regError } = await supabase
      .from('airdrop_registrations')
      .delete()
      .eq('wallet_address', wallet);

    if (regError) {
      console.error('Error deleting registration:', regError);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete user registration: ' + regError.message,
      });
    }

    console.log(`Successfully deleted user: ${wallet}`);

    return res.status(200).json({
      success: true,
      message: `User ${wallet} permanently deleted from all tables`,
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error while deleting user',
    });
  }
}
