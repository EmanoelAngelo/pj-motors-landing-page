import { useState, useEffect, useRef } from 'react';
import { getSupabase } from '@/utils/supabase';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const setupCalled = useRef(false);

  // Garante que o admin user existe via edge function — só chama UMA vez
  useEffect(() => {
    if (setupCalled.current) return;
    setupCalled.current = true;
    const supabase = getSupabase();
    supabase.functions.invoke('admin-setup').catch(() => {});
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!email.trim() || !senha.trim()) {
      setErro('Preencha todos os campos');
      return;
    }

    setCarregando(true);
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha.trim(),
      });

      if (error) {
        if (error.message.includes('Invalid login')) {
          setErro('Credenciais inválidas');
        } else {
          setErro('Erro ao fazer login. Tente novamente.');
        }
        setCarregando(false);
        return;
      }

      onLogin();
    } catch {
      setErro('Erro de conexão. Tente novamente.');
    }
    setCarregando(false);
  };

  return (
    <div className="min-h-screen bg-background-950 flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-500/15 border border-primary-500/30 flex items-center justify-center">
          <i className="ri-shield-user-line text-2xl text-primary-400" />
        </div>
        <h1 className="font-heading text-xl font-bold text-foreground-50">PJ Motors</h1>
        <p className="text-xs text-foreground-500 mt-1">Painel Administrativo</p>
      </div>

      {/* Card de login */}
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-background-900/60 border border-background-700/40 rounded-2xl p-6">
        <h2 className="font-heading text-lg font-semibold text-foreground-100 mb-5">Acessar painel</h2>

        {erro && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <i className="ri-error-warning-line flex-shrink-0" />
            {erro}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-xs font-medium text-foreground-500 mb-1.5">Login</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-600">
              <i className="ri-user-line text-sm" />
            </div>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin"
              className="w-full bg-background-950 border border-background-700/50 rounded-xl pl-9 pr-4 py-3 text-sm text-foreground-100 placeholder-foreground-700 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-xs font-medium text-foreground-500 mb-1.5">Senha</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-600">
              <i className="ri-lock-line text-sm" />
            </div>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-background-950 border border-background-700/50 rounded-xl pl-9 pr-4 py-3 text-sm text-foreground-100 placeholder-foreground-700 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={carregando}
          className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-background-50 font-semibold text-sm cursor-pointer transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {carregando ? (
            <>
              <div className="w-4 h-4 border-2 border-background-50/30 border-t-background-50 rounded-full animate-spin" />
              Entrando...
            </>
          ) : (
            <>
              <i className="ri-login-box-line" />
              Entrar
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-xs text-foreground-700">
        Área restrita — somente administradores
      </p>
    </div>
  );
}