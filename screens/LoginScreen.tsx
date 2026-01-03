import React, { useState } from 'react';
import { User } from '../types';
import { Zap, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (!username || !password || !email) {
          setError('Por favor, preencha todos os campos.');
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: username,
            },
          },
        });

        if (signUpError) throw signUpError;

        setIsRegistering(false);
        setError('Conta criada! Verifique seu email para confirmar o cadastro.');
      } else {
        // Simple mock bypass for demo/admin if needed, but let's go full Supabase
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email || username, // Allow using the first field as email if it looks like one
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          onLogin({
            id: data.user.id,
            username: data.user.user_metadata.display_name || data.user.email?.split('@')[0] || 'User',
            email: data.user.email || '',
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro na autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[950px] min-h-[600px] rounded-3xl shadow-2xl flex overflow-hidden border border-slate-100">

        {/* Left Side: Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative flex-col justify-between p-16 text-white overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2629&auto=format&fit=crop"
              className="w-full h-full object-cover opacity-30 mix-blend-overlay"
              alt="background"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-900/50"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">Schumacher Tecnologia Ltda.</span>
            </div>

            <h2 className="text-4xl font-extrabold leading-tight mb-6">
              Gerencie suas conversas de forma eficiente.
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              Acompanhe o desempenho, automatize respostas e configure seu bot em um só lugar.
            </p>
          </div>

          <div className="relative z-10 flex gap-2">
            <div className="h-1.5 w-10 bg-emerald-500 rounded-full"></div>
            <div className="h-1.5 w-10 bg-slate-700 rounded-full"></div>
            <div className="h-1.5 w-10 bg-slate-700 rounded-full"></div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full lg:w-1/2 p-8 md:p-16 flex flex-col justify-center bg-white">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-10">
              <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
                {isRegistering ? 'Crie sua conta' : 'Bem-vindo de volta'}
              </h1>
              <p className="text-slate-500">
                {isRegistering ? 'Cadastre-se para começar a usar a Schumacher.' : 'Insira seus dados para acessar o painel.'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {isRegistering && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nome de Usuário</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3.5 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                      placeholder="Nome para exibição"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3.5 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-bold text-slate-700">Senha</label>
                  {!isRegistering && <a href="#" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">Esqueceu a senha?</a>}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border-slate-200 border rounded-xl py-3.5 pl-12 pr-4 text-slate-900 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {!isRegistering && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="remember" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all" />
                  <label htmlFor="remember" className="text-sm text-slate-500 font-medium">Lembrar por 30 dias</label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? 'Processando...' : (isRegistering ? 'Criar minha conta' : 'Entrar na plataforma')}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-slate-500">
                {isRegistering ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
                <button
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="font-bold text-emerald-600 hover:text-emerald-700 underline decoration-emerald-200 underline-offset-4 transition-all"
                >
                  {isRegistering ? 'Faça login agora' : 'Cadastre-se grátis'}
                </button>
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
