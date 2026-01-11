import { createClient } from '@supabase/supabase-js';
import { updateUserNFTCache } from '@/lib/mining';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Contratos NFT a monitorear (Base network)
const CONTRACTS = {
  MINERS: '0x132e7e2b63070adc4169ef9f9d5f8af2be91f4f5',
  MEMES: '0xa11233cd58e76d1a149c86bac503742636c8f60c',
  PASS: '0xca84fa4b3e0956ed97015c0b2d42750f122244f7',
};

const COLLECTIONS = {
  [CONTRACTS.MINERS]: { slug: 'archive-of-meme-miners', type: 'miner' },
  [CONTRACTS.MEMES]: { slug: 'archive-of-meme-arch', type: 'meme' },
  [CONTRACTS.PASS]: { slug: 'archive-of-meme-pass', type: 'pass' },
};

const MONITORED_CONTRACTS = Object.values(CONTRACTS).map(c => c.toLowerCase());

// Signing key de Alchemy para verificar webhooks (opcional pero recomendado)
const ALCHEMY_SIGNING_KEY = process.env.ALCHEMY_WEBHOOK_SIGNING_KEY;

/**
 * Webhook endpoint para recibir notificaciones de Alchemy
 * Cuando un usuario compra/vende un NFT, Alchemy nos notifica
 * y actualizamos el cache de ese usuario automáticamente
 */
export async function POST(request) {
  try {
    const body = await request.json();

    // Log para debugging (quitar en producción)
    console.log('[Alchemy Webhook] Received event:', body.type);

    // Verificar que es un evento de NFT Activity
    if (body.type !== 'NFT_ACTIVITY') {
      return Response.json({ success: true, message: 'Event type ignored' });
    }

    const activities = body.event?.activity || [];

    if (activities.length === 0) {
      return Response.json({ success: true, message: 'No activities' });
    }

    // Recoger todas las wallets afectadas
    const affectedWallets = new Set();

    for (const activity of activities) {
      const contractAddress = activity.contractAddress?.toLowerCase();

      // Solo procesar si es uno de nuestros contratos
      if (!MONITORED_CONTRACTS.includes(contractAddress)) {
        continue;
      }

      // Añadir wallets afectadas (from y to)
      if (activity.fromAddress && activity.fromAddress !== '0x0000000000000000000000000000000000000000') {
        affectedWallets.add(activity.fromAddress.toLowerCase());
      }
      if (activity.toAddress && activity.toAddress !== '0x0000000000000000000000000000000000000000') {
        affectedWallets.add(activity.toAddress.toLowerCase());
      }
    }

    if (affectedWallets.size === 0) {
      return Response.json({ success: true, message: 'No relevant wallets' });
    }

    console.log('[Alchemy Webhook] Affected wallets:', Array.from(affectedWallets));

    // Verificar qué wallets son usuarios registrados
    const { data: users, error } = await supabase
      .from('mining_users')
      .select('wallet')
      .in('wallet', Array.from(affectedWallets));

    if (error) {
      console.error('[Alchemy Webhook] DB error:', error);
      return Response.json({ success: false, error: 'DB error' }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return Response.json({ success: true, message: 'No registered users affected' });
    }

    // Actualizar NFT cache de cada usuario afectado
    const apiKey = process.env.OPENSEA_API_KEY;

    if (!apiKey) {
      console.error('[Alchemy Webhook] OpenSea API key not configured');
      return Response.json({ success: false, error: 'API not configured' }, { status: 500 });
    }

    // Actualizar ambos caches en paralelo:
    // 1. mining_users (para minería) - via updateUserNFTCache
    // 2. user_nft_cache (para avatares) - via updateUserAvatarCache
    const updatePromises = users.map(async (user) => {
      try {
        await Promise.all([
          updateUserNFTCache(user.wallet, apiKey),
          updateUserAvatarCache(user.wallet, apiKey),
        ]);
        console.log(`[Alchemy Webhook] Updated all caches for ${user.wallet}`);
      } catch (err) {
        console.error(`[Alchemy Webhook] Failed to update ${user.wallet}:`, err);
      }
    });

    // Esperamos las actualizaciones (Alchemy espera respuesta en <30s)
    await Promise.all(updatePromises);

    return Response.json({
      success: true,
      message: `Updated ${users.length} user(s)`,
      wallets: users.map(u => u.wallet)
    });

  } catch (error) {
    console.error('[Alchemy Webhook] Error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Alchemy también puede enviar GET para verificar el endpoint
export async function GET() {
  return Response.json({
    status: 'active',
    message: 'Alchemy webhook endpoint is ready',
    monitored_contracts: MONITORED_CONTRACTS.length
  });
}

/**
 * Actualizar el cache de NFTs para avatares (user_nft_cache)
 * Se llama cuando el webhook detecta una transferencia de NFT
 */
async function updateUserAvatarCache(wallet, apiKey) {
  const walletLower = wallet.toLowerCase();

  // Obtener user_id
  const { data: user, error: userError } = await supabase
    .from('mining_users')
    .select('id')
    .eq('wallet', walletLower)
    .single();

  if (userError || !user) {
    console.log(`[Avatar Cache] User not found: ${walletLower}`);
    return;
  }

  // Limpiar cache antiguo de este usuario
  await supabase
    .from('user_nft_cache')
    .delete()
    .eq('user_id', user.id);

  // Obtener NFTs de todas las colecciones
  const allNfts = [];

  for (const [contract, info] of Object.entries(COLLECTIONS)) {
    try {
      const response = await fetch(
        `https://api.opensea.io/api/v2/chain/base/account/${walletLower}/nfts?collection=${info.slug}`,
        {
          headers: {
            'accept': 'application/json',
            'x-api-key': apiKey,
          },
        }
      );

      if (!response.ok) continue;

      const data = await response.json();

      if (data.nfts && data.nfts.length > 0) {
        for (const nft of data.nfts) {
          allNfts.push({
            user_id: user.id,
            contract_address: contract.toLowerCase(),
            token_id: nft.identifier,
            collection_type: info.type,
            name: nft.name || `${info.type} #${nft.identifier}`,
            image_url: nft.image_url || nft.display_image_url || null,
            cached_at: new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.error(`[Avatar Cache] Error fetching ${info.slug}:`, err);
    }
  }

  // Insertar nuevos NFTs en el cache
  if (allNfts.length > 0) {
    const { error: insertError } = await supabase
      .from('user_nft_cache')
      .insert(allNfts);

    if (insertError) {
      console.error('[Avatar Cache] Insert error:', insertError);
    } else {
      console.log(`[Avatar Cache] Cached ${allNfts.length} NFTs for ${walletLower}`);
    }
  }
}
