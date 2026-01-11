import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/notifications - Get user's notifications
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const unreadOnly = searchParams.get('unread') === 'true';

  if (!wallet) {
    return Response.json({ error: 'Wallet required' }, { status: 400 });
  }

  try {
    // Get user
    const { data: user, error: userError } = await supabase
      .from('mining_users')
      .select('id')
      .eq('wallet', wallet.toLowerCase())
      .single();

    if (userError || !user) {
      return Response.json({ notifications: [], unreadCount: 0 });
    }

    // Get notifications
    let query = supabase
      .from('user_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error: notifError } = await query;

    if (notifError) throw notifError;

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('user_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    return Response.json({
      notifications: (notifications || []).map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        icon: n.icon,
        actionUrl: n.action_url,
        isRead: n.is_read,
        createdAt: n.created_at,
        timeAgo: getTimeAgo(n.created_at),
      })),
      unreadCount: unreadCount || 0,
    });

  } catch (error) {
    console.error('Notifications error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/notifications - Mark notification(s) as read
 */
export async function PUT(request) {
  try {
    const { wallet, notificationId, markAll } = await request.json();

    if (!wallet) {
      return Response.json({ error: 'Wallet required' }, { status: 400 });
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from('mining_users')
      .select('id')
      .eq('wallet', wallet.toLowerCase())
      .single();

    if (userError || !user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    if (markAll) {
      // Mark all as read
      const { data: result } = await supabase.rpc('mark_all_notifications_read', {
        p_user_id: user.id,
      });

      return Response.json({
        success: true,
        markedCount: result || 0,
      });
    } else if (notificationId) {
      // Verify notification belongs to user
      const { data: notif } = await supabase
        .from('user_notifications')
        .select('id')
        .eq('id', notificationId)
        .eq('user_id', user.id)
        .single();

      if (!notif) {
        return Response.json({ error: 'Notification not found' }, { status: 404 });
      }

      // Mark single as read
      await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId,
      });

      return Response.json({ success: true });
    } else {
      return Response.json({ error: 'notificationId or markAll required' }, { status: 400 });
    }

  } catch (error) {
    console.error('Mark notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Helper: Get time ago string
 */
function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
