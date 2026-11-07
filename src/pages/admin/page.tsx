import { useState, useEffect } from 'react';
import { getSupabase } from '@/utils/supabase';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';

export default function AdminPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setAutenticado(true);
      }
      setVerificando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAutenticado(!!session);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (verificando) {
    return (
      <div className="min-h-screen bg-background-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!autenticado) {
    return <LoginScreen onLogin={() => setAutenticado(true)} />;
  }

  return <Dashboard />;
}