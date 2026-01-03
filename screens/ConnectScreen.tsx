import React, { useState, useEffect } from 'react';
import { RefreshCw, Zap, ShieldCheck, Smartphone, CheckCircle, Loader2, LogOut, XCircle } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

import { getBackendUrl } from '../lib/api';

const ConnectScreen: React.FC = () => {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [qrCode, setQrCode] = useState<string>('');
  const [connectionError, setConnectionError] = useState(false);
  const [useSimulation, setUseSimulation] = useState(false);
  const backendUrl = getBackendUrl();

  useEffect(() => {
    if (useSimulation) return;

    // Function to poll WhatsApp status and QR
    const fetchWhatsAppStatus = async (isFirstRun = false) => {
      try {
        const response = await fetch(`${backendUrl} /whatsapp/qrcode`);
        if (!response.ok) throw new Error('Backend offline');

        const data = await response.json();

        if (data.connected) {
          setStatus('connected');
          setQrCode('');
          setConnectionError(false);
        } else {
          if (data.qr) {
            setQrCode(data.qr);
            setStatus('disconnected'); // Ready to scan
          } else {
            setStatus('connecting'); // Waiting for QR generation
          }
          setConnectionError(false);
        }
      } catch (error) {
        console.error('Error fetching WhatsApp status:', error);
        // Só mostra erro se não for a primeira tentativa logo ao carregar
        if (!isFirstRun) {
          setConnectionError(true);
        }
      }
    };

    // Initial fetch with small delay to prevent immediate error flash
    const initialTimeout = setTimeout(() => fetchWhatsAppStatus(true), 1000);

    // Set interval for 3 seconds
    const interval = setInterval(() => fetchWhatsAppStatus(false), 3000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };

  }, [useSimulation]);

  const handleDisconnect = () => {
    // In a real scenario, we might want to call a logout endpoint.
    // For now, we'll just reset local state or reload.
    if (useSimulation) {
      setStatus('disconnected');
      setUseSimulation(false);
      setConnectionError(false);
    } else {
      setStatus('disconnected');
      setQrCode('');
      // Optionally notify backend to logout if such endpoint existed
      window.location.reload();
    }
  };


  const handleRefresh = () => {
    window.location.reload();
  };

  const activateSimulation = () => {
    setUseSimulation(true);
    setConnectionError(false);
    setStatus('disconnected');
  };

  const handleSimulateConnection = () => {
    setStatus('connecting');
    setTimeout(() => {
      setStatus('connected');
    }, 3000);
  };

  if (status === 'connected') {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">WhatsApp Conectado</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Seu dispositivo está vinculado e pronto para uso.</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 p-12 flex flex-col items-center justify-center text-center shadow-xl shadow-emerald-100/50 dark:shadow-none">
          <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Conexão Estabelecida!</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
            O WhatsApp Business foi vinculado com sucesso. Agora você pode gerenciar seus atendimentos automaticamente.
          </p>

          <button
            onClick={handleDisconnect}
            className="flex items-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-xl text-red-600 dark:text-red-400 font-bold transition-all"
          >
            <LogOut className="w-5 h-5" /> Desconectar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Conectar WhatsApp</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Vincule seu dispositivo para começar a automatizar seus atendimentos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* QR Code Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 flex flex-col items-center justify-center text-center shadow-xl shadow-slate-200/50 dark:shadow-none">
          <div className="relative group">
            <div className={`absolute - inset - 1 bg - gradient - to - tr from - emerald - 500 to - green - 400 rounded - 3xl blur opacity - 25 transition - all ${status === 'connecting' ? 'opacity-60 duration-1000 animate-pulse' : 'group-hover:opacity-40'} `}></div>
            <div className="relative w-64 h-64 bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-inner border border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden">
              {/* Real QR Code or Loading State */}
              {connectionError && !useSimulation ? (
                <div className="flex flex-col items-center gap-4 text-center p-4">
                  <XCircle className="w-12 h-12 text-red-500" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Falha ao conectar ao Backend</span>
                  <div className="text-xs text-slate-500 max-w-[250px] mb-2 space-y-2">
                    <p>O servidor remoto precisa de autorização.</p>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                      <p className="font-bold text-amber-700 dark:text-amber-400 mb-1">1. Copie esta senha:</p>
                      <code className="block bg-white dark:bg-black p-1 rounded select-all font-mono text-[10px] break-all">
                        2804:4dbc:8b00:ed:1d20:a136:73d9:75c8
                      </code>
                    </div>
                    <a
                      href={`${backendUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center py-2 bg-emerald-500 text-white font-bold rounded hover:bg-emerald-600 transition-colors"
                    >
                      2. Clique aqui para Liberar Acesso
                    </a>
                    <p className="text-[10px]">Cole a senha na página que abrir e clique em Submit.</p>
                  </div>
                  <button onClick={activateSimulation} className="text-xs text-slate-400 underline hover:text-emerald-500 mt-2">
                    Usar Modo Simulação
                  </button>
                </div>
              ) : !qrCode && !useSimulation ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 animate-pulse">
                    {status === 'connecting' ? 'Iniciando serviço...' : 'Aguardando QR Code...'}
                  </span>
                  <p className="text-xs text-slate-400 max-w-[200px]">Certifique-se de que o servidor esta rodando (npm run server).</p>
                </div>
              ) : useSimulation && status !== 'connecting' ? (
                // Simulation Pattern
                <div className="w-full h-full opacity-80 grid grid-cols-10 grid-rows-10 gap-1.5 p-2">
                  {[...Array(100)].map((_, i) => (
                    <div key={i} className={`rounded - sm transition - all duration - 700 ${Math.random() > 0.4 ? 'bg-slate-900 dark:bg-slate-400' : 'bg-transparent'} `}></div>
                  ))}
                  <div className="absolute top-6 left-6 w-16 h-16 border-4 border-slate-900 dark:border-slate-200 rounded-lg flex items-center justify-center"><div className="w-8 h-8 bg-slate-900 dark:bg-slate-200 rounded"></div></div>
                  <div className="absolute top-6 right-6 w-16 h-16 border-4 border-slate-900 dark:border-slate-200 rounded-lg flex items-center justify-center"><div className="w-8 h-8 bg-slate-900 dark:bg-slate-200 rounded"></div></div>
                  <div className="absolute bottom-6 left-6 w-16 h-16 border-4 border-slate-900 dark:border-slate-200 rounded-lg flex items-center justify-center"><div className="w-8 h-8 bg-slate-900 dark:bg-slate-200 rounded"></div></div>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl border border-slate-100 dark:border-slate-800">
                      <Zap className="w-8 h-8 text-emerald-500 fill-emerald-500" />
                    </div>
                  </div>
                </div>
              ) : !useSimulation ? (
                <div className="p-2 bg-white rounded-xl">
                  <QRCodeCanvas value={qrCode} size={220} />
                </div>
              ) : (
                // Simulation Loading
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 animate-pulse">Simulando conexão...</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-12 w-full max-w-sm">
            {useSimulation ? (
              <button
                onClick={handleSimulateConnection}
                disabled={status === 'connecting'}
                className="flex-1 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {status === 'connecting' ? 'Conectando...' : 'Simular Conexão'}
              </button>
            ) : (
              <button
                onClick={handleRefresh}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 transition-all"
              >
                <RefreshCw className="w-5 h-5" /> Recarregar
              </button>
            )}
          </div>
          <p className="mt-6 text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
            {useSimulation ? 'Modo de Simulação Ativo' : 'Aponte a câmera do seu celular'}
          </p>
        </div>

        {/* Instructions Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 shadow-sm flex flex-col">
          <div className="mb-8">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              Como conectar <Smartphone className="w-6 h-6 text-emerald-500" />
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Siga os passos abaixo para vincular seu WhatsApp Business.</p>
          </div>

          <div className="space-y-8 flex-1">
            {[
              { n: 1, title: 'Abra o WhatsApp', desc: 'No seu celular, abra o aplicativo do WhatsApp.' },
              { n: 2, title: 'Acesse o Menu', desc: 'Toque em Configurações ou nos três pontinhos superiores.' },
              { n: 3, title: 'Aparelhos Conectados', desc: 'Toque em "Aparelhos Conectados" > "Conectar Aparelho".' },
              { n: 4, title: 'Escaneie o Código', desc: 'Aponte a câmera do celular para este QR Code.' }
            ].map((step, i) => (
              <div key={i} className="flex gap-5 group">
                <div className="shrink-0 w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-900 dark:text-white font-black group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-400 transition-all duration-300">
                  {step.n}
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 dark:text-white tracking-tight">{step.title}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 p-5 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-2xl flex gap-4 items-start">
            <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-emerald-900 dark:text-emerald-400 font-bold leading-tight">Conexão Segura</p>
              <p className="text-xs text-emerald-700 dark:text-emerald-500/80 mt-1">Seus dados de conexão são criptografados e não armazenamos senhas ou tokens diretos.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectScreen;
