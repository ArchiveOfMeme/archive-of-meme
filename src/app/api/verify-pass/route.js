// API para verificar si una wallet tiene el Community Pass (Token #8)

const OPENSEA_API = 'https://api.opensea.io/api/v2';
const CHAIN = 'base';
const CONTRACT = process.env.NEXT_PUBLIC_PASS_CONTRACT;
const TOKEN_ID = process.env.NEXT_PUBLIC_PASS_TOKEN_ID;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return Response.json({ error: 'Wallet address required' }, { status: 400 });
  }

  const apiKey = process.env.OPENSEA_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'API not configured' }, { status: 500 });
  }

  try {
    // Query OpenSea for NFTs owned by this wallet from our collection
    const response = await fetch(
      `${OPENSEA_API}/chain/${CHAIN}/account/${wallet.toLowerCase()}/nfts?collection=archive-of-meme-arch`,
      {
        headers: {
          'accept': 'application/json',
          'x-api-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error('OpenSea API error:', response.status);
      return Response.json({ hasPass: false, error: 'API error' }, { status: 200 });
    }

    const data = await response.json();

    // Check if user owns Token #8 (Community Pass)
    const hasPass = data.nfts?.some(
      (nft) => nft.identifier === TOKEN_ID || nft.token_id === TOKEN_ID
    ) || false;

    return Response.json({
      hasPass,
      wallet: wallet.toLowerCase(),
      tokenId: TOKEN_ID
    });

  } catch (error) {
    console.error('Error verifying pass:', error.message);
    return Response.json({ hasPass: false, error: error.message }, { status: 200 });
  }
}
