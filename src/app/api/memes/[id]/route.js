const COLLECTION_SLUG = 'archive-of-meme-arch';
const CHAIN = 'base';
const OPENSEA_API = 'https://api.opensea.io/api/v2';

export async function GET(request, { params }) {
  const { id } = await params;
  const apiKey = process.env.OPENSEA_API_KEY;

  if (!apiKey) {
    return Response.json({ error: 'API not configured' }, { status: 500 });
  }

  try {
    // Fetch all NFTs and find the one with matching ID
    const response = await fetch(
      `${OPENSEA_API}/collection/${COLLECTION_SLUG}/nfts?limit=50`,
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': apiKey,
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      return Response.json({ error: 'OpenSea API error' }, { status: response.status });
    }

    const data = await response.json();

    const nft = data.nfts?.find((n) => n.identifier === id || n.token_id === id);

    if (!nft) {
      return Response.json({ error: 'Meme not found' }, { status: 404 });
    }

    // Get original IPFS image
    let image = '/images/placeholder.png';
    if (nft.original_image_url) {
      image = nft.original_image_url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    } else if (nft.image_url) {
      image = nft.image_url;
    }

    const meme = {
      id: nft.identifier || nft.token_id || '0',
      name: nft.name || 'Untitled',
      image,
      description: nft.description || '',
      opensea_url: `https://opensea.io/assets/${CHAIN}/${nft.contract}/${nft.identifier}`,
      contract: nft.contract,
      token_standard: nft.token_standard,
    };

    return Response.json({ meme });

  } catch (error) {
    console.error('Error fetching meme:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
