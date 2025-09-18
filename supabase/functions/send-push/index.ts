import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Inicializa Supabase cliente
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
console.log('Supabase client initializing with URL:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);
console.log('Supabase client initialized');

// Función para enviar notificación push
async function sendPushNotification(tokens, message) {
  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(
      tokens.map((token) => ({
        to: token,
        title: message.title,
        body: message.body,
        data: message.data || {},
        sound: 'default',
        priority: 'high'
      }))
    )
  });
  const result = await response.json();
  console.log('Push notification response:', result);
  return result;
}

serve(async (req) => {
  try {
    const { type, data } = await req.json();
    // Obtener tokens de los destinatarios
    let tokens = [];
    let message = { title: '', body: '' };

    switch (type) {
      case 'match_reminder': {
        const { user_id, start_time, court_number } = data;
        const { data: deviceData, error } = await supabase
          .from('user_devices')
          .select('expo_push_token')
          .eq('user_id', user_id);
        console.log('Query result:', deviceData, 'Error:', error);
        tokens = deviceData?.map((d) => d.expo_push_token) || [];
        message = {
          title: '¡Recordatorio de partido!',
          body: `Tienes un partido programado a las ${start_time} en la pista ${court_number}.`,
          data: { type: 'match_reminder' }
        };
        break;
      }
      case 'booking_cancelled': {
        const { community_id, full_name, date, start_time } = data;
        const { data: profiles } = await supabase.from('profiles').select('id').eq('resident_community_id', community_id);
        const userIds = profiles?.map((p) => p.id) || [];
        const { data: deviceData } = await supabase.from('user_devices').select('expo_push_token').in('user_id', userIds);
        tokens = deviceData?.map((d) => d.expo_push_token) || [];
        message = {
          title: 'Pista liberada',
          body: `${full_name} ha cancelado una reserva el ${date} a las ${start_time}. ¡Reserva ahora!`,
          data: { type: 'booking_cancelled' }
        };
        break;
      }
      case 'match_ended': {
        const { user_id } = data;
        const { data: deviceData } = await supabase.from('user_devices').select('expo_push_token').eq('user_id', user_id);
        tokens = deviceData?.map((d) => d.expo_push_token) || [];
        message = {
          title: 'Partido terminado',
          body: 'Por favor, añade el resultado de tu partido ahora.',
          data: { type: 'match_ended' }
        };
        break;
      }
      case 'result_proposed': {
        const { match_id, proposed_by_player, match_date } = data;
        const { data: match } = await supabase.from('matches').select('player1_id, player2_id, player3_id, player4_id').eq('id', match_id).single();
        const playerIds = [match.player1_id, match.player2_id, match.player3_id, match.player4_id].filter((id) => id && id !== proposed_by_player);
        const { data: deviceData } = await supabase.from('user_devices').select('expo_push_token').in('user_id', playerIds);
        const { data: proposer } = await supabase.from('profiles').select('full_name').eq('id', proposed_by_player).single();
        tokens = deviceData?.map((d) => d.expo_push_token) || [];
        message = {
          title: 'Resultado propuesto',
          body: `${proposer?.full_name} ha propuesto un resultado para el partido del ${match_date}. Revisa y confirma.`,
          data: { type: 'result_proposed', match_id }
        };
        break;
      }
      default:
        return new Response(JSON.stringify({ error: 'Invalid notification type' }), { status: 400 });
    }

    if (tokens.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid tokens found' }), { status: 400 });
    }

    await sendPushNotification(tokens, message);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error('Error in send-push:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});