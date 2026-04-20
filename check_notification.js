import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wmfhrhgevyrjjswkblgt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZmhyaGdldnlyampzd2tibGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzI1NzYsImV4cCI6MjA3NDkwODU3Nn0.AhaWs-12JKmc3iJNvyxPbOs6os1M36TxZinQuOmPRpY'
);

async function checkNotifications() {
  console.log('Verificando notificaciones...\n');

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total de notificaciones: ${notifications.length}\n`);

  notifications.forEach((notif, index) => {
    console.log(`\n--- Notificación ${index + 1} ---`);
    console.log(`Título: ${notif.title}`);
    console.log(`Mensaje: ${notif.message}`);
    console.log(`request_id: ${notif.request_id || 'NULL ❌ (No aparecerá el botón)'}`);
    console.log(`adset: ${notif.adset || 'NULL'}`);
    console.log(`Creada: ${new Date(notif.created_at).toLocaleString()}`);
  });

  console.log('\n\n--- Verificando tabla requests ---');
  const { data: request, error: reqError } = await supabase
    .from('requests')
    .select('id, sheet_row_id')
    .eq('sheet_row_id', '58')
    .maybeSingle();

  if (reqError) {
    console.error('Error buscando request:', reqError);
  } else if (request) {
    console.log(`✅ Request encontrado con sheet_row_id=58`);
    console.log(`   UUID: ${request.id}`);
  } else {
    console.log('❌ No se encontró ningún request con sheet_row_id=58');
    console.log('   La función no puede encontrar el request_id para la notificación');
  }
}

checkNotifications();
