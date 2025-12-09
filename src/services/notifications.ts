import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  agent_id: string | null;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CreateNotificationParams {
  user_id: string;
  agent_id?: string | null;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
}

/**
 * Create a new notification
 */
export async function createNotification(params: CreateNotificationParams): Promise<Notification | null> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: params.user_id,
        agent_id: params.agent_id || null,
        type: params.type,
        title: params.title,
        message: params.message,
        is_read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(userId: string, unreadOnly: boolean = false): Promise<Notification[]> {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get notifications:', error);
    return [];
  }
}

/**
 * Get notifications for a specific agent
 */
export async function getAgentNotifications(agentId: string, unreadOnly: boolean = false): Promise<Notification[]> {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('agent_id', agentId)
      .order('created_at', { ascending: false });

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get agent notifications:', error);
    return [];
  }
}

/**
 * Mark notification(s) as read
 */
export async function markAsRead(notificationIds: string[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', notificationIds);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to mark notifications as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    return false;
  }
}

/**
 * Delete notification(s)
 */
export async function deleteNotification(notificationIds: string[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', notificationIds);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Failed to delete notifications:', error);
    return false;
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Failed to get unread count:', error);
    return 0;
  }
}

/**
 * Get unread notification count for a specific agent
 */
export async function getAgentUnreadCount(agentId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('agent_id', agentId)
      .eq('is_read', false);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Failed to get agent unread count:', error);
    return 0;
  }
}

/**
 * Auto-generate subscription expiry notifications
 * Call this periodically (e.g., daily cron job)
 */
export async function generateExpiryNotifications(): Promise<void> {
  try {
    // Get all active subscriptions
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*, telegram_agents(user_id, project_name, id)')
      .eq('payment_status', 'confirmed')
      .gte('expiry_date', new Date().toISOString());

    if (error) throw error;
    if (!subscriptions) return;

    for (const sub of subscriptions) {
      const expiryDate = new Date(sub.expiry_date);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const agent = sub.telegram_agents as any;
      if (!agent) continue;

      // Check if notification already exists for this period
      const { data: existingNotifications } = await supabase
        .from('notifications')
        .select('id')
        .eq('agent_id', agent.id)
        .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()); // Last 24 hours

      if (existingNotifications && existingNotifications.length > 0) {
        continue; // Skip if notification already sent today
      }

      // 7 days before expiry - Warning
      if (daysUntilExpiry === 7) {
        await createNotification({
          user_id: agent.user_id,
          agent_id: agent.id,
          type: 'warning',
          title: 'Subscription Expiring Soon',
          message: `Your subscription for "${agent.project_name}" expires in 7 days. Renew now to avoid service interruption.`
        });
      }

      // 3 days before expiry - Warning
      if (daysUntilExpiry === 3) {
        await createNotification({
          user_id: agent.user_id,
          agent_id: agent.id,
          type: 'warning',
          title: 'Subscription Expiring in 3 Days',
          message: `Your subscription for "${agent.project_name}" expires in 3 days. Renew to keep your agent running.`
        });
      }

      // 1 day before expiry - Urgent
      if (daysUntilExpiry === 1) {
        await createNotification({
          user_id: agent.user_id,
          agent_id: agent.id,
          type: 'error',
          title: 'Subscription Expiring Tomorrow!',
          message: `Your subscription for "${agent.project_name}" expires tomorrow. Renew immediately to prevent downtime.`
        });
      }

      // On expiry day - Error
      if (daysUntilExpiry === 0) {
        await createNotification({
          user_id: agent.user_id,
          agent_id: agent.id,
          type: 'error',
          title: 'Subscription Expired',
          message: `Your subscription for "${agent.project_name}" has expired. Your agent has been paused. Renew to resume service.`
        });
      }
    }

    console.log('[NOTIFICATIONS] Expiry notifications generated successfully');
  } catch (error) {
    console.error('[NOTIFICATIONS] Failed to generate expiry notifications:', error);
  }
}
