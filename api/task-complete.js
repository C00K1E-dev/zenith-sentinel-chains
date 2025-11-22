import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { walletAddress, taskId, points } = req.body;

    // Validate required fields
    if (!walletAddress || !taskId || points === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: walletAddress, taskId, points',
      });
    }

    const normalizedWallet = walletAddress.toLowerCase();

    // Get or create user
    const { data: existingUser, error: getUserError } = await supabase
      .from('airdrop_users')
      .select('*')
      .eq('wallet_address', normalizedWallet)
      .single();

    if (getUserError && getUserError.code !== 'PGRST116') {
      throw new Error(`Error fetching user: ${getUserError.message}`);
    }

    let user;

    if (!existingUser) {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('airdrop_users')
        .insert({
          wallet_address: normalizedWallet,
          total_points: points,
          completed_tasks: [taskId],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Error creating user: ${createError.message}`);
      }
      user = newUser;
    } else {
      // Check if task already completed
      if (existingUser.completed_tasks && existingUser.completed_tasks.includes(taskId)) {
        return res.status(400).json({
          success: false,
          error: 'Task already completed',
        });
      }

      // Update existing user
      const newPoints = (existingUser.total_points || 0) + points;
      const newCompletedTasks = [...(existingUser.completed_tasks || []), taskId];

      const { data: updatedUser, error: updateError } = await supabase
        .from('airdrop_users')
        .update({
          total_points: newPoints,
          completed_tasks: newCompletedTasks,
          updated_at: new Date().toISOString(),
        })
        .eq('wallet_address', normalizedWallet)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Error updating user: ${updateError.message}`);
      }
      user = updatedUser;
    }

    // Log task completion
    const { error: logError } = await supabase
      .from('airdrop_task_completions')
      .insert({
        wallet_address: normalizedWallet,
        task_id: taskId,
        points_earned: points,
        completed_at: new Date().toISOString(),
      });

    if (logError) {
      console.error('Error logging task completion:', logError.message);
      // Don't throw - task was completed even if logging failed
    }

    return res.status(200).json({
      success: true,
      data: {
        wallet_address: user.wallet_address,
        total_points: user.total_points,
        completed_tasks: user.completed_tasks,
      },
    });
  } catch (error) {
    console.error('Task completion error:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
    });
  }
}
