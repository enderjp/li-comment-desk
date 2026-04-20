import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wmfhrhgevyrjjswkblgt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZmhyaGdldnlyampzd2tibGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzI1NzYsImV4cCI6MjA3NDkwODU3Nn0.AhaWs-12JKmc3iJNvyxPbOs6os1M36TxZinQuOmPRpY',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Sign in as the test user
await supabase.auth.signInWithPassword({
  email: 'test3@example.com',
  password: 'Test1234!'
});

console.log('Logged in as:', (await supabase.auth.getUser()).data.user?.id);

// Try to fetch the test video
const { data, error } = await supabase
  .from('comments')
  .select('*')
  .ilike('adset', '%Baudi_Ene15_TEST 5%');

console.log('Found videos:', data?.length);
console.log('Videos:', data);
console.log('Error:', error);

process.exit(0);
