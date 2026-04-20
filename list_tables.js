import { createClient } from '@supabase/supabase-js';

// Create client without auth to check RLS
const supabase = createClient(
  'https://wmfhrhgevyrjjswkblgt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZmhyaGdldnlyampzd2tibGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzI1NzYsImV4cCI6MjA3NDkwODU3Nn0.AhaWs-12JKmc3iJNvyxPbOs6os1M36TxZinQuOmPRpY'
);

// Get all comments that have "test" in adset
const { data, error } = await supabase
  .from('comments')
  .select('id, adset, request_id')
  .ilike('adset', '%test%');

console.log('Found videos with "test":', data?.length);
console.log('Videos:', data);
console.log('Error:', error);

// Try to get user info
const { data: { user } } = await supabase.auth.getUser();
console.log('\nCurrent user:', user?.id || 'Not authenticated');

process.exit(0);
