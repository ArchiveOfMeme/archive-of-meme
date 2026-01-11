import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/events - Obtener eventos activos
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get('all') === 'true'; // Para admin

    if (includeAll) {
      // Obtener todos los eventos (para admin panel)
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: false })
        .limit(50);

      if (error) throw error;

      return Response.json({ events: events || [] });
    }

    // Obtener solo eventos activos
    const { data: activeEvents, error } = await supabase
      .rpc('get_all_active_events');

    if (error) throw error;

    // Formatear respuesta
    const events = (activeEvents || []).map(e => ({
      id: e.event_id,
      name: e.event_name,
      type: e.event_type,
      multiplier: parseFloat(e.multiplier),
      icon: e.icon,
      description: e.description,
      startsAt: e.starts_at,
      endsAt: e.ends_at,
    }));

    // El evento con mayor multiplicador es el "principal"
    const mainEvent = events.length > 0 ? events[0] : null;

    // Si no hay evento activo, buscar el próximo evento futuro
    let nextEvent = null;
    if (!mainEvent) {
      const { data: upcomingEvents } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .gt('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(1);

      if (upcomingEvents && upcomingEvents.length > 0) {
        const e = upcomingEvents[0];
        nextEvent = {
          id: e.id,
          name: e.name,
          type: e.type,
          multiplier: parseFloat(e.multiplier),
          icon: e.icon,
          description: e.description,
          startsAt: e.start_date,
        };
      }
    }

    return Response.json({
      hasActiveEvent: events.length > 0,
      mainEvent,
      allActiveEvents: events,
      nextEvent,
    });

  } catch (error) {
    console.error('Events error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/events - Crear evento especial (admin)
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, description, multiplier, icon, startDate, endDate, adminKey } = body;

    // Verificar admin key (simple security)
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validaciones
    if (!name || !startDate || !endDate) {
      return Response.json({ error: 'name, startDate, and endDate required' }, { status: 400 });
    }

    const mult = parseFloat(multiplier) || 1.5;
    if (mult < 1 || mult > 5) {
      return Response.json({ error: 'Multiplier must be between 1 and 5' }, { status: 400 });
    }

    // Crear evento
    const { data: newEventId, error } = await supabase.rpc('create_special_event', {
      p_name: name,
      p_description: description || `Special event: ${name}`,
      p_multiplier: mult,
      p_icon: icon || '🎉',
      p_start_date: new Date(startDate).toISOString(),
      p_end_date: new Date(endDate).toISOString(),
    });

    if (error) throw error;

    return Response.json({
      success: true,
      eventId: newEventId,
      message: `Event "${name}" created successfully`,
    });

  } catch (error) {
    console.error('Create event error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/events - Desactivar evento (admin)
 */
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { eventId, adminKey } = body;

    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!eventId) {
      return Response.json({ error: 'eventId required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('events')
      .update({ is_active: false })
      .eq('id', eventId);

    if (error) throw error;

    return Response.json({ success: true });

  } catch (error) {
    console.error('Delete event error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
