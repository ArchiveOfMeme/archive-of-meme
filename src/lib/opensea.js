const COLLECTION_SLUG = 'archive-of-meme-arch';
const CHAIN = 'base';

// OpenSea API - necesitamos usar un proxy o API key para evitar CORS
const OPENSEA_API = 'https://api.opensea.io/api/v2';

export async function getCollectionNFTs() {
  try {
    // Intentar con OpenSea API
    const response = await fetch(
      `${OPENSEA_API}/collection/${COLLECTION_SLUG}/nfts?limit=50`,
      {
        headers: {
          'accept': 'application/json',
        },
        mode: 'cors',
      }
    );

    if (!response.ok) {
      // Si falla, devolver array vacío (colección vacía o error de API)
      console.log('OpenSea API response:', response.status);
      return [];
    }

    const data = await response.json();

    // Transformar datos al formato que usa nuestra app
    const memes = data.nfts?.map((nft) => ({
      id: nft.identifier || nft.token_id || '0',
      name: nft.name || 'Untitled',
      image: nft.image_url || nft.display_image_url || '/images/placeholder.png',
      description: nft.description || '',
      opensea_url: `https://opensea.io/assets/${CHAIN}/${nft.contract}/${nft.identifier}`,
    })) || [];

    return memes;
  } catch (error) {
    console.error('Error fetching NFTs:', error);
    // En caso de error (CORS, etc), devolver array vacío
    return [];
  }
}

export { COLLECTION_SLUG, CHAIN };
