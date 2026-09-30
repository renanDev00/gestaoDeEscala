import { supabase } from './src/lib/supabase.js';
async function test() {
  const { data, error } = await supabase.from('grupos_domingo').select('*');
  console.log('grupos_domingo:', data, error);
}
test();
