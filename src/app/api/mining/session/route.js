import { getMiningSessionStatus } from '@/lib/mining';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  if (!wallet) {
    return Response.json({ error: 'Wallet address required' }, { status: 400 });
  }

  try {
    const status = await getMiningSessionStatus(wallet);

    if (status.error) {
      return Response.json({ error: status.error }, { status: 404 });
    }

    return Response.json(status);
  } catch (error) {
    console.error('Get session status error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
