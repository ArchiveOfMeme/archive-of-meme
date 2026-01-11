import { claimMiningSession } from '@/lib/mining';

export async function POST(request) {
  try {
    const { wallet } = await request.json();

    if (!wallet) {
      return Response.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const result = await claimMiningSession(wallet);

    if (!result.success) {
      return Response.json(
        {
          success: false,
          error: result.error,
          message: getErrorMessage(result.error),
          currentPoints: result.currentPoints,
          minPoints: result.minPoints,
        },
        { status: 400 }
      );
    }

    return Response.json(result);
  } catch (error) {
    console.error('Claim mining session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function getErrorMessage(error) {
  switch (error) {
    case 'USER_NOT_FOUND':
      return 'User not found. Please connect your wallet.';
    case 'NO_ACTIVE_SESSION':
      return 'No active mining session to claim.';
    case 'MIN_POINTS_NOT_REACHED':
      return 'Minimum points not reached. Keep mining!';
    default:
      return 'Unable to claim mining session';
  }
}
