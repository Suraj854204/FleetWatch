// Creates a confirmed demo user in Supabase Auth using the service-role key (never ship this key to the browser).
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run seed:user
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.DEMO_EMAIL ?? 'demo@fleetwatch.app';
const password = process.env.DEMO_PASSWORD ?? 'Fleet@Demo2026';

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first.');
  process.exit(1);
}
const sb = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
const { error } = await sb.auth.admin.createUser({ email, password, email_confirm: true });
if (error && !/already/i.test(error.message)) {
  console.error('Failed:', error.message);
  process.exit(1);
}
console.log(error ? 'User already exists.' : 'Demo user created.', `\n  email:    ${email}\n  password: ${password}`);
