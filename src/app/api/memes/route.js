const COLLECTION_SLUG = 'archive-of-meme-arch';
const CHAIN = 'base';
const OPENSEA_API = 'https://api.opensea.io/api/v2';

export async function GET() {
  const apiKey = process.env.OPENSEA_API_KEY;

  if (!apiKey) {
    console.error('OPENSEA_API_KEY not configured');
    return Response.json({ memes: [], source: 'error', debug: 'missing_api_key' });
  }

  try {
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
      const errorText = await response.text();
      console.error('OpenSea API error:', response.status, errorText);
      return Response.json({ memes: [], source: 'error', debug: `opensea_${response.status}` });
    }

    const data = await response.json();

    const memes = data.nfts?.map((nft) => {
      // Prefer original IPFS image, convert ipfs:// to HTTP gateway
      let image = '/images/placeholder.png';
      if (nft.original_image_url) {
        image = nft.original_image_url.replace('ipfs://', 'https://ipfs.io/ipfs/');
      } else if (nft.image_url) {
        image = nft.image_url;
      }

      return {
        id: nft.identifier || nft.token_id || '0',
        name: nft.name || 'Untitled',
        image,
        description: nft.description || '',
        opensea_url: `https://opensea.io/assets/${CHAIN}/${nft.contract}/${nft.identifier}`,
      };
    }) || [];

    // Sort by ID descending (newest first)
    memes.sort((a, b) => Number(b.id) - Number(a.id));

    return Response.json({ memes, source: 'opensea' });
  } catch (error) {
    console.error('Error fetching NFTs:', error.message);
    return Response.json({ memes: [], source: 'error', debug: error.message });
  }
}
