import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  if (!wallet) {
    return Response.json({ error: 'Wallet address required' }, { status: 400 });
  }

  try {
    // Get user ID first
    const { data: user, error: userError } = await supabase
      .from('mining_users')
      .select('id')
      .eq('wallet', wallet.toLowerCase())
      .single();

    if (userError || !user) {
      return Response.json({ transactions: [], total: 0 });
    }

    // Get transactions with count
    const { data: transactions, error: txError, count } = await supabase
      .from('mining_transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (txError) throw txError;

    return Response.json({
      transactions: transactions || [],
      total: count || 0,
      hasMore: (offset + limit) < count,
    });
  } catch (error) {
    console.error('Error getting history:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
