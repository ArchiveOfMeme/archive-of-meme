import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/cron/meme-monday
 *
 * Cron job para crear el evento Meme Monday automáticamente.
 * Debe ejecutarse cada domingo a las 23:00 UTC.
 *
 * En Vercel, añadir a vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/meme-monday",
 *     "schedule": "0 23 * * 0"
 *   }]
 * }
 */
export async function GET(request) {
  try {
    // Verificar autorización (Vercel cron o admin manual)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Vercel envía el cron secret en el header
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Permitir si es llamada local en desarrollo
      if (process.env.NODE_ENV === 'production') {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Crear Meme Monday para el próximo lunes
    const { data: eventId, error } = await supabase.rpc('create_meme_monday');

    if (error) throw error;

    // Enviar notificación a todos los usuarios (opcional, puede ser costoso)
    // Por ahora solo retornamos éxito

    return Response.json({
      success: true,
      eventId,
      message: 'Meme Monday event created for next Monday',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Meme Monday cron error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
