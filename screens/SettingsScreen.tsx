
import React from 'react';
import { 
  Save, 
  X, 
  Info, 
  Bot, 
  Settings2, 
  Clock, 
  Globe, 
  Copy, 
  Webhook, 
  Key,
  ShieldCheck,
  Zap
} from 'lucide-react';

const SettingsScreen: React.FC = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Configurações</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Personalize o comportamento do seu chatbot e integrações.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Bot Config Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-slate-50 dark:border-slate-800">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Configuração do Bot</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Defina o tom de voz do seu assistente</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nome do Bot</label>
              <input 
                type="text" 
                defaultValue="Vitta Bot"
                className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Mensagem de Boas-vindas</label>
              <textarea 
                rows={3}
                defaultValue="Olá! 👋 Sou o assistente virtual da Vitta. Como posso ajudar você hoje?"
                className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Mensagem de Ausência</label>
              <textarea 
                rows={3}
                defaultValue="No momento não estamos disponíveis. Deixe sua mensagem que retornaremos em breve!"
                className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Automation & Toggles */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-slate-50 dark:border-slate-800">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-lg">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Automação</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Controle as regras automáticas</p>
            </div>
          </div>

          <div className="space-y-6">
            {[
              { id: 't1', label: 'Respostas Automáticas', desc: 'Permitir que o bot responda mensagens recebidas.', checked: true },
              { id: 't2', label: 'Horário Comercial', desc: 'Ativar automação apenas fora do horário comercial.', checked: false },
              { id: 't3', label: 'Notificações Push', desc: 'Receber alertas no navegador para novas mensagens.', checked: true },
              { id: 't4', label: 'Leitura Automática', desc: 'Marcar mensagens como lidas após resposta do bot.', checked: false }
            ].map((t) => (
              <div key={t.id} className="flex items-center justify-between group">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{t.label}</h3>
                  <p className="text-xs text-slate-400 font-medium">{t.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked={t.checked} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Schedule Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-slate-50 dark:border-slate-800">
            <div className="p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Horário de Funcionamento</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Defina quando o bot deve atuar</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Abertura</label>
               <input type="time" defaultValue="09:00" className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" />
             </div>
             <div>
               <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fechamento</label>
               <input type="time" defaultValue="18:00" className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 outline-none font-bold" />
             </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Dias de Atendimento</label>
            <div className="flex flex-wrap gap-2">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                <button 
                  key={i} 
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all ${i === 0 || i === 6 ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* API Integration */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-2 border-b border-slate-50 dark:border-slate-800">
            <div className="p-2 bg-purple-50 dark:bg-purple-500/10 text-purple-600 rounded-lg">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">Integração API</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configurações para desenvolvedores</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Webhook URL</label>
              <div className="relative group">
                 <Webhook className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                  type="text" 
                  defaultValue="https://api.vitta.com/webhooks/bot-1"
                  className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Chave da API</label>
              <div className="flex gap-2">
                <div className="flex-1 relative group">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="password" 
                    defaultValue="sk_vitta_test_839210"
                    className="w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium"
                  />
                </div>
                <button className="px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-all">
                  <Copy className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/10 flex gap-3">
             <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
             <p className="text-xs text-blue-700 dark:text-blue-400 font-medium leading-relaxed">
               Lembre-se de configurar seu servidor para aceitar requisições do tipo POST. Consulte a <a href="#" className="font-bold underline">documentação técnica</a> para mais detalhes.
             </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
        <button className="px-8 py-3.5 text-sm font-bold text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-all">
          Descartar Alterações
        </button>
        <button className="px-10 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2">
          <Save className="w-5 h-5" /> Salvar Configurações
        </button>
      </div>
    </div>
  );
};

export default SettingsScreen;
