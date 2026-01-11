import { verifyMinerNFT, countUserMemes, verifyPass } from '@/lib/mining';

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
    // Verificar minero, memes y pass en paralelo
    const [minerData, memeCount, hasPass] = await Promise.all([
      verifyMinerNFT(wallet, apiKey),
      countUserMemes(wallet, apiKey),
      verifyPass(wallet, apiKey),
    ]);

    return Response.json({
      wallet: wallet.toLowerCase(),
      miner: minerData,
      memeCount,
      hasPass,
    });
  } catch (error) {
    console.error('Error verifying miner:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
