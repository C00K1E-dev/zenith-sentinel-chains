import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { walletAddress, xHandle, telegramHandle, email, timestamp } = req.body;

    // Validate required fields
    if (!walletAddress || !xHandle || !telegramHandle || !email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format',
      });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
      });
    }

    const registrationData = {
      wallet_address: walletAddress.toLowerCase(),
      x_handle: xHandle.startsWith('@') ? xHandle : `@${xHandle}`,
      telegram_handle: telegramHandle,
      email,
      status: 'registered',
    };

    // Upsert to Supabase
    const { data, error } = await supabase
      .from('airdrop_registrations')
      .upsert([registrationData], { onConflict: 'wallet_address' });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    console.log('Registration saved:', registrationData);

    return res.status(200).json({
      success: true,
      message: 'Registration saved successfully',
      data: registrationData,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'An error occurred while saving registration',
    });
  }
}
