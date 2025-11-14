// Mock in-memory storage for development
let registrations = [];

export async function handleAirdropRegister(req, res) {
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
      walletAddress: walletAddress.toLowerCase(),
      xHandle: xHandle.startsWith('@') ? xHandle : `@${xHandle}`,
      telegramHandle,
      email,
      timestamp: timestamp || Date.now(),
      createdAt: new Date().toISOString(),
      status: 'registered',
    };

    // Check for duplicate
    const existingIndex = registrations.findIndex(
      r => r.walletAddress === registrationData.walletAddress
    );

    if (existingIndex >= 0) {
      // Update existing
      registrations[existingIndex] = registrationData;
    } else {
      // Add new
      registrations.push(registrationData);
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
      error: 'An error occurred',
    });
  }
}

export async function handleAirdropRegistrations(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { adminKey: providedKey } = req.query;
    const adminKey = process.env.VITE_ADMIN_KEY || '006046';

    if (providedKey !== adminKey) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Get stats
    const uniqueEmails = new Set(registrations.map(r => r.email)).size;
    const uniqueTelegrams = new Set(registrations.map(r => r.telegramHandle)).size;

    return res.status(200).json({
      success: true,
      data: {
        total: registrations.length,
        uniqueEmails,
        uniqueTelegrams,
        registrations: registrations.map(r => ({
          wallet: r.walletAddress,
          x: r.xHandle,
          telegram: r.telegramHandle,
          email: r.email,
          registered: r.createdAt,
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
