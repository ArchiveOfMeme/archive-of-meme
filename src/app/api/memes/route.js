// API para obtener la galería de memes
// Usa Alchemy NFT API (más rápido y confiable que OpenSea)

const MEMES_CONTRACT = '0xa11233cd58e76d1a149c86bac503742636c8f60c';
const CHAIN = 'base';

export async function GET() {
  const alchemyKey = process.env.ALCHEMY_API_KEY;

  if (!alchemyKey) {
    console.error('ALCHEMY_API_KEY not configured');
    return Response.json({ memes: [], source: 'error', debug: 'missing_alchemy_key' });
  }

  try {
    // Alchemy NFT API - getNFTsForContract
    const response = await fetch(
      `https://base-mainnet.g.alchemy.com/nft/v3/${alchemyKey}/getNFTsForContract?contractAddress=${MEMES_CONTRACT}&withMetadata=true&limit=50`,
      {
        headers: {
          'accept': 'application/json',
        },
        next: { revalidate: 60 }, // Cache por 60 segundos
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Alchemy API error:', response.status, errorText);
      return Response.json({ memes: [], source: 'error', debug: `alchemy_${response.status}` });
    }

    const data = await response.json();

    const allMemes = data.nfts
      ?.map((nft) => {
        // Alchemy proporciona diferentes formatos de imagen
        let image = '/images/placeholder.png';

        // 1. Imagen en gateway de Alchemy (más rápido)
        if (nft.image?.cachedUrl) {
          image = nft.image.cachedUrl;
        }
        // 2. Imagen original con gateway
        else if (nft.image?.pngUrl) {
          image = nft.image.pngUrl;
        }
        // 3. URL original
        else if (nft.image?.originalUrl) {
          const originalUrl = nft.image.originalUrl;
          if (originalUrl.startsWith('ipfs://')) {
            image = originalUrl.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/');
          } else {
            image = originalUrl;
          }
        }
        // 4. Raw metadata
        else if (nft.raw?.metadata?.image) {
          const rawImage = nft.raw.metadata.image;
          if (rawImage.startsWith('ipfs://')) {
            image = rawImage.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/');
          } else {
            image = rawImage;
          }
        }

        return {
          id: nft.tokenId || '0',
          name: nft.name || nft.raw?.metadata?.name || 'Untitled',
          image,
          description: nft.description || nft.raw?.metadata?.description || '',
          opensea_url: `https://opensea.io/assets/${CHAIN}/${MEMES_CONTRACT}/${nft.tokenId}`,
        };
      }) || [];

    // Deduplicate by ID
    const uniqueMap = new Map();
    allMemes.forEach((meme) => {
      if (!uniqueMap.has(meme.id)) {
        uniqueMap.set(meme.id, meme);
      }
    });
    const memes = Array.from(uniqueMap.values());

    // Sort by ID descending (newest first)
    memes.sort((a, b) => Number(b.id) - Number(a.id));

    // Alchemy returns pageKey when there are more pages
    const hasMore = !!data.pageKey;

    return Response.json({ memes, hasMore, source: 'alchemy' });
  } catch (error) {
    console.error('Error fetching NFTs:', error.message);
    return Response.json({ memes: [], source: 'error', debug: error.message });
  }
}
