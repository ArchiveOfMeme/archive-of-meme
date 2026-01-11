// API para verificar si una wallet tiene el OG Pass
// Usa el cache de mining_users (actualizado por Alchemy webhooks)

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PASS_COLLECTION_SLUG = 'archive-of-meme-pass';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return Response.json({ error: 'Wallet address required' }, { status: 400 });
  }

  try {
    const walletLower = wallet.toLowerCase();

    // Leer del cache en mining_users (actualizado por Alchemy webhooks)
    const { data: user, error } = await supabase
      .from('mining_users')
      .select('cached_has_pass')
      .eq('wallet', walletLower)
      .single();

    if (error || !user) {
      // Usuario no registrado - no tiene pass
      return Response.json({
        hasPass: false,
        wallet: walletLower,
        collection: PASS_COLLECTION_SLUG,
      });
    }

    return Response.json({
      hasPass: user.cached_has_pass || false,
      wallet: walletLower,
      collection: PASS_COLLECTION_SLUG,
    });

  } catch (error) {
    console.error('Error verifying OG Pass:', error.message);
    return Response.json({ hasPass: false, error: error.message }, { status: 200 });
  }
}
