// API para obtener un meme específico por ID
// Usa Alchemy NFT API (más rápido y confiable que OpenSea)

const MEMES_CONTRACT = '0xa11233cd58e76d1a149c86bac503742636c8f60c';
const CHAIN = 'base';

export async function GET(request, { params }) {
  const { id } = await params;
  const alchemyKey = process.env.ALCHEMY_API_KEY;

  if (!alchemyKey) {
    return Response.json({ error: 'ALCHEMY_API_KEY not configured' }, { status: 500 });
  }

  try {
    // Alchemy NFT API - getNFTMetadata (obtener un NFT específico)
    const response = await fetch(
      `https://base-mainnet.g.alchemy.com/nft/v3/${alchemyKey}/getNFTMetadata?contractAddress=${MEMES_CONTRACT}&tokenId=${id}&refreshCache=false`,
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
      return Response.json({ error: 'Alchemy API error' }, { status: response.status });
    }

    const nft = await response.json();

    if (!nft || !nft.tokenId) {
      return Response.json({ error: 'Meme not found' }, { status: 404 });
    }

    // Obtener la mejor imagen disponible
    let image = '/images/placeholder.png';

    if (nft.image?.cachedUrl) {
      image = nft.image.cachedUrl;
    } else if (nft.image?.pngUrl) {
      image = nft.image.pngUrl;
    } else if (nft.image?.originalUrl) {
      const originalUrl = nft.image.originalUrl;
      if (originalUrl.startsWith('ipfs://')) {
        image = originalUrl.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/');
      } else {
        image = originalUrl;
      }
    } else if (nft.raw?.metadata?.image) {
      const rawImage = nft.raw.metadata.image;
      if (rawImage.startsWith('ipfs://')) {
        image = rawImage.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/');
      } else {
        image = rawImage;
      }
    }

    const meme = {
      id: nft.tokenId,
      name: nft.name || nft.raw?.metadata?.name || 'Untitled',
      image,
      description: nft.description || nft.raw?.metadata?.description || '',
      opensea_url: `https://opensea.io/assets/${CHAIN}/${MEMES_CONTRACT}/${nft.tokenId}`,
      contract: MEMES_CONTRACT,
      token_standard: nft.tokenType || 'ERC721',
    };

    return Response.json({ meme, source: 'alchemy' });

  } catch (error) {
    console.error('Error fetching meme:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
