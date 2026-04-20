import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://wmfhrhgevyrjjswkblgt.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZmhyaGdldnlyampzd2tibGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzI1NzYsImV4cCI6MjA3NDkwODU3Nn0.AhaWs-12JKmc3iJNvyxPbOs6os1M36TxZinQuOmPRpY'
);

// Try with user 58ceda35-6ed4-4dcd-bc12-eafd80c08d1f (test3@example.com)
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: 'test3@example.com',
  password: 'Test1234!'
});

if (authError) {
  console.log('Auth error:', authError);
  process.exit(1);
}

console.log('Logged in as:', authData.user.id);

// Fetch all comments
const { data: allComments, error: allError } = await supabase
  .from('comments')
  .select('id, adset');

console.log('\nTotal comments visible:', allComments?.length);

// Filter for test videos
const testVideos = allComments?.filter(c => c.adset?.toLowerCase().includes('test'));
console.log('Test videos visible:', testVideos?.length);
console.log('Test videos:', testVideos);

// Try direct query for test videos
const { data: directTest, error: directError } = await supabase
  .from('comments')
  .select('id, adset')
  .ilike('adset', '%test%');

console.log('\nDirect test query found:', directTest?.length);
console.log('Direct query results:', directTest);

process.exit(0);
