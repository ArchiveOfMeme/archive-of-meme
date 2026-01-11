import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const OPENSEA_API_KEY = process.env.OPENSEA_API_KEY;
const MINER_COLLECTION = 'archive-of-meme-miners';
const PASS_COLLECTION = 'archive-of-meme-pass';
const MEMES_COLLECTION = 'archive-of-meme-arch';
const MINER_CONTRACT = '0x132e7e2b63070adc4169ef9f9d5f8af2be91f4f5';
const PASS_CONTRACT = '0xca84fa4b3e0956ed97015c0b2d42750f122244f7';
const MEMES_CONTRACT = '0xa11233cd58e76d1a149c86bac503742636c8f60c';

/**
 * GET /api/avatar - Obtener opciones de avatar del usuario
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');
  const refresh = searchParams.get('refresh') === 'true';

  if (!wallet) {
    return Response.json({ error: 'Wallet required' }, { status: 400 });
  }

  try {
    const walletLower = wallet.toLowerCase();

    // Get user with avatar_auto_mode
    const { data: user, error: userError } = await supabase
      .from('mining_users')
      .select('id, avatar_type, avatar_nft_contract, avatar_nft_token_id, avatar_nft_url, avatar_auto_mode')
      .eq('wallet', walletLower)
      .single();

    if (userError || !user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // Check cache first (unless refresh requested)
    if (!refresh) {
      const { data: cachedNfts } = await supabase
        .from('user_nft_cache')
        .select('*')
        .eq('user_id', user.id)
        .order('cached_at', { ascending: false });

      if (cachedNfts && cachedNfts.length > 0) {
        // Auto-assign if in auto mode and current avatar doesn't match best NFT
        let currentAvatar = {
          type: user.avatar_type,
          contract: user.avatar_nft_contract,
          tokenId: user.avatar_nft_token_id,
          imageUrl: user.avatar_nft_url,
        };

        if (user.avatar_auto_mode) {
          const bestNft = getBestNFT(cachedNfts);
          if (bestNft && (user.avatar_type === 'default' ||
              user.avatar_nft_contract !== bestNft.contract_address ||
              user.avatar_nft_token_id !== bestNft.token_id)) {
            // Auto-assign the best NFT
            await supabase.rpc('auto_assign_avatar', {
              p_user_id: user.id,
              p_avatar_type: bestNft.collection_type,
              p_contract: bestNft.contract_address,
              p_token_id: bestNft.token_id,
              p_image_url: bestNft.image_url,
            });
            currentAvatar = {
              type: bestNft.collection_type,
              contract: bestNft.contract_address,
              tokenId: bestNft.token_id,
              imageUrl: bestNft.image_url,
            };
          }
        }

        return Response.json({
          currentAvatar,
          options: cachedNfts.map(nft => ({
            contract: nft.contract_address,
            tokenId: nft.token_id,
            type: nft.collection_type,
            name: nft.name,
            imageUrl: nft.image_url,
          })),
        });
      }
    }

    // Fetch fresh NFT data from OpenSea
    const nftOptions = await fetchUserNFTs(walletLower);

    // Cache the NFTs
    for (const nft of nftOptions) {
      await supabase.rpc('cache_user_nft', {
        p_user_id: user.id,
        p_contract: nft.contract,
        p_token_id: nft.tokenId,
        p_collection_type: nft.type,
        p_name: nft.name,
        p_image_url: nft.imageUrl,
      });
    }

    // Auto-assign if in auto mode
    let currentAvatar = {
      type: user.avatar_type,
      contract: user.avatar_nft_contract,
      tokenId: user.avatar_nft_token_id,
      imageUrl: user.avatar_nft_url,
    };

    if (user.avatar_auto_mode && nftOptions.length > 0) {
      const bestNft = getBestNFTFromOptions(nftOptions);
      if (bestNft && (user.avatar_type === 'default' ||
          user.avatar_nft_contract !== bestNft.contract ||
          user.avatar_nft_token_id !== bestNft.tokenId)) {
        await supabase.rpc('auto_assign_avatar', {
          p_user_id: user.id,
          p_avatar_type: bestNft.type,
          p_contract: bestNft.contract,
          p_token_id: bestNft.tokenId,
          p_image_url: bestNft.imageUrl,
        });
        currentAvatar = {
          type: bestNft.type,
          contract: bestNft.contract,
          tokenId: bestNft.tokenId,
          imageUrl: bestNft.imageUrl,
        };
      }
    }

    return Response.json({
      currentAvatar,
      options: nftOptions,
    });

  } catch (error) {
    console.error('Avatar GET error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Obtener el mejor NFT para auto-asignar (de cache)
 * Prioridad: Miner (por nivel) > Pass > Meme más reciente
 */
function getBestNFT(cachedNfts) {
  // Buscar miners primero (prioridad por nivel basado en token_id)
  const miners = cachedNfts.filter(n => n.collection_type === 'miner');
  if (miners.length > 0) {
    // Ordenar por token_id descendente (asumiendo que mayor token_id = más reciente/mejor)
    miners.sort((a, b) => parseInt(b.token_id) - parseInt(a.token_id));
    return miners[0];
  }

  // Buscar pass
  const passes = cachedNfts.filter(n => n.collection_type === 'pass');
  if (passes.length > 0) {
    return passes[0];
  }

  // Buscar meme más reciente
  const memes = cachedNfts.filter(n => n.collection_type === 'meme');
  if (memes.length > 0) {
    // El más reciente está primero (ordenado por cached_at desc)
    return memes[0];
  }

  return null;
}

/**
 * Obtener el mejor NFT para auto-asignar (de options frescos)
 */
function getBestNFTFromOptions(nftOptions) {
  const miners = nftOptions.filter(n => n.type === 'miner');
  if (miners.length > 0) {
    miners.sort((a, b) => parseInt(b.tokenId) - parseInt(a.tokenId));
    return miners[0];
  }

  const passes = nftOptions.filter(n => n.type === 'pass');
  if (passes.length > 0) {
    return passes[0];
  }

  const memes = nftOptions.filter(n => n.type === 'meme');
  if (memes.length > 0) {
    return memes[0];
  }

  return null;
}

/**
 * PUT /api/avatar - Actualizar avatar del usuario
 */
export async function PUT(request) {
  try {
    const { wallet, avatarType, contract, tokenId, imageUrl } = await request.json();

    if (!wallet) {
      return Response.json({ error: 'Wallet required' }, { status: 400 });
    }

    const walletLower = wallet.toLowerCase();

    // Get user
    const { data: user, error: userError } = await supabase
      .from('mining_users')
      .select('id')
      .eq('wallet', walletLower)
      .single();

    if (userError || !user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    // If setting to NFT, verify ownership
    if (avatarType !== 'default' && contract && tokenId) {
      const { data: cachedNft } = await supabase
        .from('user_nft_cache')
        .select('id')
        .eq('user_id', user.id)
        .eq('contract_address', contract.toLowerCase())
        .eq('token_id', tokenId)
        .single();

      if (!cachedNft) {
        return Response.json({ error: 'NFT not owned or not cached' }, { status: 403 });
      }
    }

    // Update avatar (manual change = disable auto mode)
    const { error: updateError } = await supabase.rpc('update_user_avatar', {
      p_user_id: user.id,
      p_avatar_type: avatarType || 'default',
      p_contract: contract?.toLowerCase() || null,
      p_token_id: tokenId || null,
      p_image_url: imageUrl || null,
      p_is_manual: true, // User manually changed, disable auto mode
    });

    if (updateError) throw updateError;

    return Response.json({ success: true, autoModeDisabled: true });

  } catch (error) {
    console.error('Avatar PUT error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Fetch all NFTs from OpenSea for a wallet
 */
async function fetchUserNFTs(wallet) {
  const nfts = [];

  // Fetch from all collections in parallel
  const [miners, passes, memes] = await Promise.all([
    fetchCollection(wallet, MINER_COLLECTION, MINER_CONTRACT, 'miner'),
    fetchCollection(wallet, PASS_COLLECTION, PASS_CONTRACT, 'pass'),
    fetchCollection(wallet, MEMES_COLLECTION, MEMES_CONTRACT, 'meme'),
  ]);

  return [...miners, ...passes, ...memes];
}

async function fetchCollection(wallet, collectionSlug, contractAddress, type) {
  try {
    const response = await fetch(
      `https://api.opensea.io/api/v2/chain/base/account/${wallet}/nfts?collection=${collectionSlug}`,
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': OPENSEA_API_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error(`OpenSea error for ${collectionSlug}:`, response.status);
      return [];
    }

    const data = await response.json();

    if (!data.nfts || data.nfts.length === 0) {
      return [];
    }

    return data.nfts.map(nft => ({
      contract: contractAddress,
      tokenId: nft.identifier,
      type,
      name: nft.name || `${type} #${nft.identifier}`,
      imageUrl: nft.image_url || nft.display_image_url || null,
    }));

  } catch (error) {
    console.error(`Error fetching ${collectionSlug}:`, error);
    return [];
  }
}
