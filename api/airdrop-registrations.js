import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { adminKey: providedKey } = req.query;
    const adminKey = process.env.ADMIN_KEY;

    if (!adminKey || providedKey !== adminKey) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Get all registrations from Supabase
    const { data, error } = await supabase
      .from('airdrop_registrations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100000);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    // Calculate stats
    const uniqueEmails = new Set(data.map(r => r.email)).size;
    const uniqueTelegrams = new Set(data.map(r => r.telegram_handle)).size;

    return res.status(200).json({
      success: true,
      data: {
        total: data.length,
        uniqueEmails,
        uniqueTelegrams,
        registrations: data.map(r => ({
          wallet: r.wallet_address,
          x: r.x_handle,
          telegram: r.telegram_handle,
          email: r.email,
          registered: r.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch registrations',
    });
  }
}
