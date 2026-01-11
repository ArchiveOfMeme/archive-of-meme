import { startMiningSession, getOrCreateMiningUser } from '@/lib/mining';

export async function POST(request) {
  try {
    const { wallet } = await request.json();

    if (!wallet) {
      return Response.json({ error: 'Wallet address required' }, { status: 400 });
    }

    const walletLower = wallet.toLowerCase();

    // Obtener o crear usuario
    // Los NFTs se actualizan automáticamente via Alchemy Webhooks
    // cuando el usuario compra/vende, no aquí
    await getOrCreateMiningUser(walletLower);

    // Iniciar sesión de minado
    const result = await startMiningSession(walletLower);

    if (!result.success) {
      const statusCode = result.error === 'SESSION_ACTIVE' ? 400 : 400;
      return Response.json(
        {
          success: false,
          error: result.error,
          message: getErrorMessage(result.error),
          sessionStartedAt: result.sessionStartedAt,
        },
        { status: statusCode }
      );
    }

    return Response.json(result);
  } catch (error) {
    console.error('Start mining session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function getErrorMessage(error) {
  switch (error) {
    case 'SESSION_ACTIVE':
      return 'You already have an active mining session';
    case 'SESSION_COMPLETE_PENDING_CLAIM':
      return 'Your mining session is complete. Please claim your points first.';
    default:
      return 'Unable to start mining session';
  }
}
