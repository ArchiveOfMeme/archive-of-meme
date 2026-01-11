import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/cron/seasons
 *
 * Cron job para gestionar temporadas:
 * 1. Verificar si hay 100 usuarios para iniciar Season 1
 * 2. Activar temporadas pendientes que llegaron a su fecha
 * 3. Finalizar temporadas que terminaron
 *
 * Ejecutar diariamente a las 00:05 UTC:
 * {
 *   "crons": [{
 *     "path": "/api/cron/seasons",
 *     "schedule": "5 0 * * *"
 *   }]
 * }
 */
export async function GET(request) {
  try {
    // Verificar autorización
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      if (process.env.NODE_ENV === 'production') {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const results = {
      seasonOneCreated: false,
      seasonActivated: false,
      seasonEnded: false,
    };

    // 1. Verificar si hay que crear Season 1
    const { data: seasonOneResult } = await supabase.rpc('check_and_start_season_one');
    results.seasonOneCreated = seasonOneResult === true;

    // 2. Activar temporadas pendientes
    const { data: activateResult } = await supabase.rpc('activate_pending_season');
    results.seasonActivated = activateResult === true;

    // 3. Finalizar temporadas terminadas
    const { data: endResult } = await supabase.rpc('check_and_end_season');
    results.seasonEnded = endResult === true;

    // Si se activó o terminó una temporada, notificar (opcional)
    if (results.seasonActivated) {
      // Aquí podrías enviar notificaciones masivas
      console.log('Season activated!');
    }

    if (results.seasonEnded) {
      // Aquí podrías enviar notificaciones de fin de temporada
      console.log('Season ended!');
    }

    return Response.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Seasons cron error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
