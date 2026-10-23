import { useAuth } from './auth/AuthProvider';
import LoginPage from './auth/LoginPage';
import Dashboard from './components/Dashboard';
import { isConfigured } from './lib/supabase';

export default function App() {
  const { session, loading } = useAuth();

  if (!isConfigured) {
    return (
      <div className="center-screen">
        <div className="notice">
          <h1>Supabase is not configured</h1>
          <p>
            Copy <code>.env.example</code> to <code>.env</code>, fill in <code>VITE_SUPABASE_URL</code> and{' '}
            <code>VITE_SUPABASE_ANON_KEY</code>, then restart the dev server. Full steps are in the README.
          </p>
        </div>
      </div>
    );
  }
  if (loading) return <div className="center-screen"><div className="spinner" aria-label="Loading" /></div>;
  // Protected route: the dashboard only renders with a valid Supabase session.
  return session ? <Dashboard /> : <LoginPage />;
}
