import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wmfhrhgevyrjjswkblgt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtZmhyaGdldnlyampzd2tibGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMzI1NzYsImV4cCI6MjA3NDkwODU3Nn0.AhaWs-12JKmc3iJNvyxPbOs6os1M36TxZinQuOmPRpY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
  console.log('Checking RLS policies status...\n');

  // Try to get a comment with "test" in adset
  const { data: testComments, error } = await supabase
    .from('comments')
    .select('id, adset, url')
    .ilike('adset', '%test%')
    .limit(5);

  if (error) {
    console.log('❌ Error fetching test comments:', error.message);
    console.log('\nEsto probablemente significa que la restricción SIGUE ACTIVA.');
    console.log('\nPara removerla, ejecuta este SQL en Supabase:');
    console.log('https://supabase.com/dashboard/project/wmfhrhgevyrjjswkblgt/sql/new\n');
    console.log('DROP POLICY IF EXISTS "Users can view comments based on video restrictions" ON comments;');
    console.log('DROP POLICY IF EXISTS "Restrict test videos to authorized users" ON comments;');
    console.log('\nCREATE POLICY "Authenticated users can view all comments"');
    console.log('  ON comments');
    console.log('  FOR SELECT');
    console.log('  TO authenticated');
    console.log('  USING (true);');
    return;
  }

  if (testComments && testComments.length > 0) {
    console.log(`✓ Found ${testComments.length} comment(s) with "test" in adset:`);
    testComments.forEach(comment => {
      console.log(`  - ID: ${comment.id}, Adset: ${comment.adset}`);
    });
    console.log('\n✓ La restricción ha sido removida - puedes ver videos con "test"');
  } else {
    console.log('No comments found with "test" in adset.');
    console.log('This could mean:');
    console.log('1. No test videos exist in the database');
    console.log('2. The restriction is still active (most likely)');
    console.log('\nTo remove the restriction, run this SQL in Supabase:');
    console.log('https://supabase.com/dashboard/project/wmfhrhgevyrjjswkblgt/sql/new');
  }

  // Try to get total count of comments
  const { count, error: countError } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true });

  if (!countError) {
    console.log(`\nTotal comments visible to this user: ${count}`);
  }
}

checkPolicies();
