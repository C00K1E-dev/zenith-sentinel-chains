
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  try {
    // Verify admin key
    const adminKey = req.headers['x-admin-key'];
    const expectedAdminKey = process.env.ADMIN_KEY;

    if (!adminKey || adminKey !== expectedAdminKey) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Get wallet address from URL
    const { wallet } = req.query;

    if (!wallet) {
      return res.status(400).json({ success: false, error: 'Wallet address required' });
    }

    // Handle GET - Retrieve user data
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('airdrop_registrations')
        .select('*')
        .eq('wallet_address', wallet)
        .single();

      if (error) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      return res.status(200).json({ success: true, data });
    }

    // Handle DELETE - Reset user progress (not permanent deletion)
    if (req.method === 'DELETE') {
      console.log(`Resetting progress for user: ${wallet}`);

      // Delete pending verifications
      await supabase
        .from('airdrop_pending_verifications')
        .delete()
        .eq('wallet_address', wallet);

      // Reset user progress
      await supabase
        .from('airdrop_user_progress')
        .delete()
        .eq('wallet_address', wallet);

      // Note: We keep the registration, just clear progress
      console.log(`Progress reset complete for: ${wallet}`);

      return res.status(200).json({
        success: true,
        message: `Progress reset for ${wallet}`,
      });
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });

  } catch (error) {
    console.error('Error handling user request:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}
