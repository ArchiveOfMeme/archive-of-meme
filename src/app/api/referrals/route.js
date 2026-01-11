import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/referrals - Get user's referral info and stats
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return Response.json({ error: 'Wallet required' }, { status: 400 });
  }

  try {
    const walletLower = wallet.toLowerCase();

    // Get user with referral code
    const { data: user, error: userError } = await supabase
      .from('mining_users')
      .select('id, wallet, referral_code, referred_by, referred_at')
      .eq('wallet', walletLower)
      .single();

    if (userError || !user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Get referral stats
    const { data: stats } = await supabase
      .from('user_referral_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get list of referrals
    const { data: referrals } = await supabase
      .from('user_referrals_list')
      .select('*')
      .eq('referrer_id', user.id)
      .order('referred_at', { ascending: false })
      .limit(20);

    // Get who referred this user (if any)
    let referredBy = null;
    if (user.referred_by) {
      const { data: referrer } = await supabase
        .from('mining_users')
        .select('wallet')
        .eq('id', user.referred_by)
        .single();

      if (referrer) {
        referredBy = {
          wallet: referrer.wallet,
          shortWallet: `${referrer.wallet.slice(0, 6)}...${referrer.wallet.slice(-4)}`,
          referredAt: user.referred_at,
        };
      }
    }

    return Response.json({
      referralCode: user.referral_code,
      referralLink: `${process.env.NEXT_PUBLIC_APP_URL || 'https://archiveofmeme.com'}?ref=${user.referral_code}`,
      stats: {
        totalReferrals: stats?.total_referrals || 0,
        activeReferrals: stats?.active_referrals || 0,
        totalPointsEarned: stats?.total_points_earned || 0,
      },
      referrals: (referrals || []).map(r => ({
        wallet: r.referred_wallet,
        shortWallet: `${r.referred_wallet.slice(0, 6)}...${r.referred_wallet.slice(-4)}`,
        points: r.referred_points,
        isActive: r.is_active,
        pointsEarned: r.points_earned_from_referral,
        referredAt: r.referred_at,
      })),
      referredBy,
    });

  } catch (error) {
    console.error('Referrals error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/referrals - Apply a referral code
 */
export async function POST(request) {
  try {
    const { wallet, referralCode } = await request.json();

    if (!wallet || !referralCode) {
      return Response.json({ error: 'Wallet and referralCode required' }, { status: 400 });
    }

    const walletLower = wallet.toLowerCase();
    const codeUpper = referralCode.toUpperCase().trim();

    // Get user
    const { data: user, error: userError } = await supabase
      .from('mining_users')
      .select('id, referred_by, referral_code')
      .eq('wallet', walletLower)
      .single();

    if (userError || !user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already referred
    if (user.referred_by) {
      return Response.json({
        error: 'ALREADY_REFERRED',
        message: 'You have already been referred by someone',
      }, { status: 400 });
    }

    // Can't use own code
    if (user.referral_code === codeUpper) {
      return Response.json({
        error: 'SELF_REFERRAL',
        message: 'You cannot use your own referral code',
      }, { status: 400 });
    }

    // Find referrer by code
    const { data: referrer, error: referrerError } = await supabase
      .from('mining_users')
      .select('id, wallet')
      .eq('referral_code', codeUpper)
      .single();

    if (referrerError || !referrer) {
      return Response.json({
        error: 'INVALID_CODE',
        message: 'Invalid referral code',
      }, { status: 400 });
    }

    // Apply referral
    const { error: updateError } = await supabase
      .from('mining_users')
      .update({
        referred_by: referrer.id,
        referred_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Record in mining_transactions for visibility
    await supabase.from('mining_transactions').insert({
      user_id: user.id,
      amount: 0,
      type: 'referral',
      description: `Applied referral code from ${referrer.wallet.slice(0, 6)}...`,
    });

    // Log activity event (shows on feed that someone joined via referral)
    try {
      await supabase.rpc('log_activity', {
        p_user_id: user.id,
        p_wallet: walletLower,
        p_event_type: 'referral_joined',
        p_event_data: {},
        p_points_amount: null,
      });

      // Create notification for the REFERRER that someone joined
      const shortWallet = `${walletLower.slice(0, 6)}...${walletLower.slice(-4)}`;
      await supabase.rpc('create_notification', {
        p_user_id: referrer.id,
        p_type: 'referral_joined',
        p_title: 'New Referral!',
        p_message: `${shortWallet} joined using your referral code. Keep earning 5% of their mining for 30 days!`,
        p_icon: '👥',
        p_action_url: '/dashboard',
      });
    } catch (activityErr) {
      console.error('Activity log error:', activityErr);
    }

    return Response.json({
      success: true,
      message: 'Referral code applied successfully!',
      referrer: {
        wallet: referrer.wallet,
        shortWallet: `${referrer.wallet.slice(0, 6)}...${referrer.wallet.slice(-4)}`,
      },
    });

  } catch (error) {
    console.error('Apply referral error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
