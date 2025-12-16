import React, { useState, useEffect, useId, useRef, useCallback } from 'react';

// --- START: Icons (Gamified Visuals) ---
const IconActivity = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
);
const IconTrophy = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);
const IconCheck = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"/></svg>
);

// --- START: Mock Data & Types ---

const LEVEL_THRESHOLDS = [
    0, 160, 320, 480, 640, 800, 960, 1120, 1280, 1440, 
    1600, 1760, 1920, 2080, 2240, 2400, 2560, 2720, 2880, 3040, 3200
];

const MOCK_PLAYERS = [
    { nickname: 'Jared', points: 980 },
    { nickname: 'Alex', points: 950 },
    { nickname: 'Vivian', points: 890 },
    { nickname: 'Leo', points: 820 },
    { nickname: 'Mara', points: 750 },
    { nickname: 'Carlos', points: 710 },
];

const ADMIN_MOCK_STATS = {
    totalParticipants: 142,
    activeUsersToday: 118,
    globalResponseRate: 76,
    pingHeatmap: [
        [98, 95, 92, 88, 85, 80, 78], // Day 1
        [95, 92, 90, 85, 82, 78, 75],
        [90, 88, 85, 82, 78, 75, 72],
        [88, 85, 82, 80, 75, 72, 70],
        [85, 82, 80, 78, 72, 70, 68],
        [82, 80, 78, 75, 70, 68, 65],
        [80, 78, 75, 72, 68, 65, 60], // Day 7
    ]
};

const calculateLevel = (xp: number): number => {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
        if (xp >= LEVEL_THRESHOLDS[i]) {
            return i + 1;
        }
    }
    return 1;
};

type User = {
  nickname: string;
  points: number;
  level: number;
  responseRate: number;
  currentStreak: number;
  completedDays: number;
  avatar?: string | null;
};

type Badge = {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
};

type PingStatus = 'completed' | 'missed' | 'pending';

type SociodemographicData = {
  age: number | string;
  gender: string;
  maritalStatus: string;
  education: string;
  occupation: string;
  continuousMedication: string;
  medicationDetails: string;
  healthDiagnosis: string;
  diagnosisDetails: string;
  monthlyIncome: string;
  platforms: string[];
  otherPlatform: string;
  usagePeriod: string;
  dailyUsage: string;
  purpose_talk: string;
  purpose_share: string;
  purpose_watch: string;
  purpose_search: string;
};

type SamResponse = {
  pleasure: number;
  arousal: number;
  dominance: number;
};

type PanasResponse = { [adjective: string]: number };

type ScreenTimeEntry = {
  id: string;
  platform: string;
  otherPlatformDetail: string;
  duration: string;
};

type InstrumentResponse = {
  timestamp: string;
  pingDay: number;
  pingIndex: number;
  type: 'regular' | 'end_of_day';
  sam?: SamResponse;
  wasWatchingFeed?: boolean;
  panas?: PanasResponse;
  sleepQuality?: number;
  stressfulEvents?: string;
  screenTimeLog?: ScreenTimeEntry[];
};

type GameState = {
  user: User;
  badges: Badge[];
  hasOnboarded: boolean;
  studyStartDate: string | null;
  responses: InstrumentResponse[];
  pings: PingStatus[][];
  sociodemographicData: SociodemographicData | null;
};

const INITIAL_GAME_STATE: GameState = {
  user: {
    nickname: 'Iniciante',
    points: 0,
    level: 1,
    responseRate: 0,
    currentStreak: 0,
    completedDays: 0,
    avatar: null,
  },
  badges: [
    { id: 'punctual', name: 'Pontualidade', description: 'Responder 80% das notificações em 10 minutos', unlocked: false },
    { id: 'week_streak', name: 'Streak Semanal', description: 'Completar todos os 7 dias', unlocked: false },
  ],
  hasOnboarded: false,
  studyStartDate: null,
  responses: [],
  pings: Array(7).fill(0).map(() => Array(7).fill('pending')),
  sociodemographicData: null,
};

type ViewState = 'LANDING' | 'USER' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD';

// --- END: Mock Data & Types ---


// --- START: Main App Component ---

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LANDING');
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      const savedState = localStorage.getItem('gameState');
      if (savedState) {
          const parsed = JSON.parse(savedState);
          // Simple migrations for new/changed state properties
          if (!parsed.pings || !Array.isArray(parsed.pings[0])) {
              parsed.pings = INITIAL_GAME_STATE.pings;
          }
          if (parsed.user && !('avatar' in parsed.user)) {
            parsed.user.avatar = null;
          }
          if (!('sociodemographicData' in parsed)) {
            parsed.sociodemographicData = null;
          }
          if (!parsed.responses) {
            parsed.responses = [];
          }
          return parsed;
      }
    } catch (error) {
        console.error("Could not parse saved game state:", error);
        return INITIAL_GAME_STATE;
    }
    return INITIAL_GAME_STATE;
  });

  useEffect(() => {
    localStorage.setItem('gameState', JSON.stringify(gameState));
  }, [gameState]);

  const completeOnboarding = (nickname: string, sociodemographicData: SociodemographicData) => {
    setGameState(prev => ({
      ...prev,
      hasOnboarded: true,
      studyStartDate: new Date().toISOString(),
      user: {
        ...prev.user,
        nickname,
      },
      sociodemographicData,
    }));
  };

  const handleAdminLoginSuccess = () => {
    setView('ADMIN_DASHBOARD');
  };

  const renderView = () => {
    switch(view) {
        case 'LANDING':
            return <LandingScreen onUserSelect={() => setView('USER')} onAdminSelect={() => setView('ADMIN_LOGIN')} />;
        case 'ADMIN_LOGIN':
            return <AdminLoginScreen onLoginSuccess={handleAdminLoginSuccess} onBack={() => setView('LANDING')} />;
        case 'ADMIN_DASHBOARD':
            return <AdminDashboardScreen onLogout={() => setView('LANDING')} />;
        case 'USER':
            return !gameState.hasOnboarded ? (
                <OnboardingScreen onComplete={completeOnboarding} />
            ) : (
                <DashboardScreen gameState={gameState} setGameState={setGameState} onLogout={() => setView('LANDING')}/>
            );
        default:
            return <LandingScreen onUserSelect={() => setView('USER')} onAdminSelect={() => setView('ADMIN_LOGIN')} />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,128,128,0.3),rgba(255,255,255,0))] text-gray-200 font-sans">
      {renderView()}
    </div>
  );
};

// --- END: Main App Component ---


// --- START: Landing & Admin Components ---

const LandingScreen: React.FC<{onUserSelect: () => void, onAdminSelect: () => void}> = ({onUserSelect, onAdminSelect}) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 relative overflow-hidden">
             {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                 <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
                 <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            </div>

            <div className="z-10 text-center max-w-2xl w-full">
                <div className="w-48 h-48 mx-auto mb-8 animate-slow-spin-slow">
                     <PlexusFace />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-2">PSYLOGOS</h1>
                <p className="text-xl text-cyan-200 mb-12 tracking-wider">O Enigma da Mente</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full px-4">
                    <button 
                        onClick={onUserSelect}
                        className="group relative overflow-hidden rounded-2xl bg-slate-800/50 border border-cyan-400/30 p-8 hover:bg-slate-800/80 transition-all duration-300 hover:shadow-glow-blue hover:-translate-y-1"
                    >
                         <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <UserIcon className="w-12 h-12 text-cyan-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                         <h2 className="text-xl font-bold text-white mb-2">Sou Participante</h2>
                         <p className="text-sm text-gray-400">Acesse sua jornada, responda aos pings e acompanhe seu progresso.</p>
                    </button>

                    <button 
                         onClick={onAdminSelect}
                         className="group relative overflow-hidden rounded-2xl bg-slate-800/50 border border-purple-400/30 p-8 hover:bg-slate-800/80 transition-all duration-300 hover:shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:-translate-y-1"
                    >
                         <div className="absolute inset-0 bg-gradient-to-br from-purple-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <ChartBarIcon className="w-12 h-12 text-purple-400 mx-auto mb-4 group-hover:scale-110 transition-transform" />
                         <h2 className="text-xl font-bold text-white mb-2">Sou Pesquisador</h2>
                         <p className="text-sm text-gray-400">Acesse o painel administrativo para monitorar o estudo e dados.</p>
                    </button>
                </div>
                
                <p className="mt-12 text-xs text-gray-500">Desenvolvido para fins de pesquisa científica - UniCEUB</p>
            </div>
        </div>
    );
};

const AdminLoginScreen: React.FC<{onLoginSuccess: () => void, onBack: () => void}> = ({onLoginSuccess, onBack}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (username === 'Thiago' && password === 'psicólogo') {
            onLoginSuccess();
        } else {
            setError('Credenciais inválidas. Tente novamente.');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
             <div className="w-full max-w-md p-8 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
                <button onClick={onBack} className="text-gray-400 hover:text-white mb-4 flex items-center text-sm">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Voltar
                </button>
                <h2 className="text-2xl font-bold text-purple-400 text-center mb-6">Acesso Administrativo</h2>
                
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-purple-300 text-sm font-bold mb-2">Usuário</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-800 border border-purple-500/30 rounded focus:outline-none focus:border-purple-500 focus:shadow-[0_0_8px_rgba(168,85,247,0.4)] text-white transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-purple-300 text-sm font-bold mb-2">Senha</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-800 border border-purple-500/30 rounded focus:outline-none focus:border-purple-500 focus:shadow-[0_0_8px_rgba(168,85,247,0.4)] text-white transition-all"
                        />
                    </div>
                    
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                    <button 
                        type="submit"
                        className="w-full px-6 py-3 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-500 transition-all duration-300 shadow-[0_0_10px_rgba(147,51,234,0.5)] mt-4"
                    >
                        Entrar
                    </button>
                </form>
             </div>
        </div>
    );
};

const AdminDashboardScreen: React.FC<{onLogout: () => void}> = ({onLogout}) => {
    const [toast, setToast] = useState<string | null>(null);

    const triggerPing = () => {
        setToast("Notificações enviadas com sucesso para 118 usuários ativos!");
        setTimeout(() => setToast(null), 3000);
    };

    const StatCard = ({label, value, icon, color}: {label: string, value: string|number, icon: any, color: string}) => (
        <div className={`bg-slate-900/50 p-6 rounded-xl border border-${color}-500/30 flex items-center space-x-4`}>
            <div className={`p-3 rounded-full bg-${color}-500/20 text-${color}-400`}>
                {icon}
            </div>
            <div>
                <p className="text-gray-400 text-sm">{label}</p>
                <p className={`text-2xl font-bold text-${color}-400`}>{value}</p>
            </div>
        </div>
    );

    return (
        <div className="p-4 sm:p-8 max-w-6xl mx-auto">
             {/* Header */}
             <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Painel do Pesquisador</h1>
                    <p className="text-gray-400">Monitoramento do Estudo: Enigma da Mente</p>
                </div>
                <button onClick={onLogout} className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors">
                    Sair
                </button>
             </header>

             {/* Toast Notification */}
             {toast && (
                <div className="fixed top-4 right-4 bg-green-500/90 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-fade-in-down flex items-center">
                    <CheckCircleIcon className="w-6 h-6 mr-2" />
                    {toast}
                </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard 
                    label="Total de Participantes" 
                    value={ADMIN_MOCK_STATS.totalParticipants} 
                    icon={<UserIcon className="w-6 h-6" />}
                    color="cyan"
                />
                <StatCard 
                    label="Usuários Ativos (Hoje)" 
                    value={ADMIN_MOCK_STATS.activeUsersToday} 
                    icon={<BellIcon className="w-6 h-6" />}
                    color="green"
                />
                <StatCard 
                    label="Taxa de Resposta Global" 
                    value={`${ADMIN_MOCK_STATS.globalResponseRate}%`} 
                    icon={<ChartBarIcon className="w-6 h-6" />}
                    color="purple"
                />
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Main Chart / Heatmap */}
                 <div className="lg:col-span-2 bg-slate-900/50 border border-cyan-500/20 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-cyan-400 mb-6">Mapa de Calor: Taxa de Resposta por Ping</h3>
                    <div className="overflow-x-auto">
                        <div className="min-w-[500px]">
                            <div className="grid grid-cols-8 gap-2 mb-2 text-center text-sm text-gray-400 font-semibold">
                                <div>Dia</div>
                                {['9h', '11h', '13h', '15h', '17h', '19h', '21h'].map(t => <div key={t}>{t}</div>)}
                            </div>
                            {ADMIN_MOCK_STATS.pingHeatmap.map((dayRates, i) => (
                                <div key={i} className="grid grid-cols-8 gap-2 mb-2 items-center">
                                    <div className="text-gray-300 font-medium text-center">Dia {i + 1}</div>
                                    {dayRates.map((rate, j) => {
                                        // Color logic based on rate
                                        let bgClass = 'bg-red-500/20 text-red-400 border-red-500/30';
                                        if (rate >= 80) bgClass = 'bg-green-500/20 text-green-400 border-green-500/30';
                                        else if (rate >= 50) bgClass = 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';

                                        return (
                                            <div key={j} className={`h-10 rounded-md border flex items-center justify-center text-sm font-bold ${bgClass} transition-all hover:scale-105 cursor-default relative group`}>
                                                {rate}%
                                                <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 text-xs px-2 py-1 rounded border border-gray-600 whitespace-nowrap z-10">
                                                    {Math.round((rate / 100) * ADMIN_MOCK_STATS.activeUsersToday)} respondentes
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="mt-4 flex justify-center space-x-6 text-sm text-gray-400">
                        <div className="flex items-center"><span className="w-3 h-3 bg-green-500/50 mr-2 rounded"></span>Alta Adesão (&gt;80%)</div>
                        <div className="flex items-center"><span className="w-3 h-3 bg-yellow-500/50 mr-2 rounded"></span>Média Adesão (50-80%)</div>
                        <div className="flex items-center"><span className="w-3 h-3 bg-red-500/50 mr-2 rounded"></span>Baixa Adesão (&lt;50%)</div>
                    </div>
                 </div>

                 {/* Control Panel */}
                 <div className="space-y-6">
                    <div className="bg-slate-900/50 border border-purple-500/20 rounded-2xl p-6">
                        <h3 className="text-xl font-bold text-purple-400 mb-4">Controle de Campo</h3>
                        <p className="text-gray-400 text-sm mb-6">Ações manuais para gerenciamento do estudo em tempo real.</p>
                        
                        <div className="space-y-4">
                            <button 
                                onClick={triggerPing}
                                className="w-full py-4 px-6 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(147,51,234,0.3)] transition-all transform hover:-translate-y-1 flex items-center justify-center"
                            >
                                <BellIcon className="w-6 h-6 mr-3" />
                                Disparar Pings Agora
                            </button>
                            <button className="w-full py-3 px-6 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 rounded-xl transition-all flex items-center justify-center">
                                <DocumentTextIcon className="w-5 h-5 mr-3" />
                                Exportar Dados (CSV)
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-gray-700 rounded-2xl p-6">
                         <h3 className="text-lg font-bold text-gray-300 mb-4">Feedbacks Recentes</h3>
                         <div className="space-y-3">
                             <div className="p-3 bg-slate-800/50 rounded-lg border-l-2 border-yellow-400 text-sm">
                                 <span className="text-yellow-400 font-bold block mb-1">Problema relatado</span>
                                 <p className="text-gray-400">Participante #42 relatou dificuldade com o slider SAM.</p>
                             </div>
                             <div className="p-3 bg-slate-800/50 rounded-lg border-l-2 border-green-400 text-sm">
                                 <span className="text-green-400 font-bold block mb-1">Sistema</span>
                                 <p className="text-gray-400">Backup de dados realizado com sucesso às 03:00.</p>
                             </div>
                         </div>
                    </div>
                 </div>
             </div>
        </div>
    );
};

// --- END: Landing & Admin Components ---


// --- START: OnboardingScreen Component ---
const RCLE_TEXT = `Você está sendo convidado(a) a participar como voluntário(a) do estudo Associação longitudinal entre exposição a vídeos curtos e variabilidade emocional: moderação da valência e efeitos no humor diário, DESENVOLVIDO POR PESQUISADORES DO Centro de Ensino Unificado de Brasília (UniCEUB). O nome deste documento que você está lendo é Registro de Consentimento Livre e Esclarecido (RCLE) que visa assegurar seus direitos como participante.
Sua colaboração neste estudo será de muita importância para nós, mas se desistir a qualquer momento, isso não lhe causará prejuízo. Antes de decidir se deseja participar (de livre e espontânea vontade) você deverá ler e compreender todo o conteúdo.
A pesquisa tem como objetivo A pesquisa tem como objetivo investigar a relação entre o tempo de exposição a vídeos curtos em plataformas digitais e a variabilidade emocional, considerando a valência afetiva do conteúdo e seus efeitos sobre o humor diário. O estudo busca entender se e como o tempo de visualização de vídeos curtos e a polaridade afetiva do conteúdo podem influenciar a flutuação de emoções e o bem-estar diário dos adultos.
A participação dos envolvidos é essencial para coletar dados que permitirão uma análise precisa dessa relação, contribuindo para uma melhor compreensão dos impactos das redes sociais na saúde mental e na regulação emocional.
Sua participação consiste em utilizar um aplicativo gamificado por sete dias, respondendo a notificações periódicas que avaliarão seu estado emocional presente, a valência dos vídeos assistidos e seu humor diário, além de registrar o tempo de uso de redes sociais. O aplicativo também incluirá perguntas sociodemográficas e avaliação momentânea sobre a valência e a variabilidade emocional, registrando o tempo de tela e a ocorrência de eventos estressores e qualidade do sono. A participação é voluntária, anônima e os dados coletados serão utilizados exclusivamente para fins acadêmicos.
Este estudo possui riscos mínimos e incluem desconforto ao responder perguntas sobre valência emocional dos vídeos e a variação de emoções ao longo do dia. Para minimizar esses riscos, todas as respostas serão anônimas e armazenadas em plataformas seguras, seguindo as orientações da CONEP para pesquisas em ambientes virtuais. Além disso, os participantes podem interromper sua participação a qualquer momento e solicitar a exclusão de seus dados. Medidas de proteção, como o uso de plataformas seguras e o cumprimento da LGPD, serão adotadas para garantir a privacidade e segurança dos dados coletados.
Com sua participação nesta pesquisa você contribuirá para um melhor entendimento da relação entre o tempo de exposição a vídeos curtos, a valência afetiva dos conteúdos e a variabilidade emocional em adultos. Embora não haja benefícios diretos para os participantes, os resultados poderão gerar insights valiosos que ajudarão na compreensão dos impactos das mídias sociais na saúde mental e no bem-estar emocional, contribuindo para debates acadêmicos e propostas de intervenção mais informadas.
Sua participação é voluntária. Você não terá nenhum prejuízo se não quiser participar. Você poderá se retirar desta pesquisa a qualquer momento, bastando para isso entrar em contato com um dos pesquisadores responsáveis. Também deverá ser esclarecido quanto ao direito do participante de não responder qualquer uma das perguntas.
Conforme previsto pelas normas brasileiras de pesquisa com a participação de seres humanos, você não receberá nenhum tipo de compensação financeira pela sua participação neste estudo.
Seus dados serão manuseados somente pelos pesquisadores e não será permitido o acesso a outras pessoas. Os dados e instrumentos utilizados (por exemplo, fitas, entrevistas, questionários) ficarão guardados sob a responsabilidade de Thiago de Souza Ferreira Carneiro com a garantia de manutenção do sigilo e confidencialidade, e arquivados por um período de 5 anos; após esse tempo serão destruídos. Os resultados deste trabalho poderão ser apresentados em encontros ou revistas científicas. Entretanto, ele mostrará apenas os resultados obtidos como um todo, sem revelar seu nome, instituição a qual pertence ou qualquer informação que esteja relacionada com sua privacidade.
Se houver alguma dúvida referente aos objetivos, procedimentos e métodos utilizados nesta pesquisa, entre em contato com os pesquisadores responsáveis pelo e-mail thiagosdcarneiro@sempreceub.com ou pelo telefone (61) 99236-0330. Também, se houver alguma consideração ou dúvida referente aos aspectos éticos da pesquisa, entre em contato com o Comitê de Ética em Pesquisa do Centro Universitário de Brasília (CEP-UniCEUB), que aprovou esta pesquisa, pelo telefone 3966-1511 ou pelo e-mail cep.uniceub@uniceub.br. O horário de atendimento do CEP-UniCEUB é de segunda a quinta: 09h30 às 12h30 e 14h30 às 18h30. Também entre em contato para informar ocorrências irregulares ou danosas durante a sua participação no estudo.
O CEP é um grupo de profissionais de várias áreas do conhecimento e da comunidade, autônomo, de relevância pública, que tem o propósito de defender os interesses dos participantes da pesquisa em sua integridade e dignidade e de contribuir para o desenvolvimento da pesquisa dentro de padrões éticos.`;

const OnboardingScreen: React.FC<{ onComplete: (nickname: string, data: SociodemographicData) => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(0); // 0: Consent, 1: Questionnaire, 2: Nickname
  const [nickname, setNickname] = useState('');
  const [sociodemographicData, setSociodemographicData] = useState<SociodemographicData | null>(null);

  const handleConsent = (agreed: boolean) => {
    if (agreed) {
      setStep(1);
    } else {
      alert("Para participar da pesquisa, você precisa concordar com os termos.");
    }
  };
  
  const handleQuestionnaireComplete = (data: SociodemographicData) => {
    setSociodemographicData(data);
    setStep(2);
  };

  const handleNicknameSubmit = () => {
    if (nickname.trim().length > 2 && sociodemographicData) {
      onComplete(nickname, sociodemographicData);
    }
  };

  if (step === 0) {
    return <ConsentScreen onConsent={handleConsent} />;
  }

  if (step === 1) {
    return <SociodemographicQuestionnaireScreen onComplete={handleQuestionnaireComplete} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-fade-in">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-cyan-400/20 shadow-glow-blue">
        <h1 className="text-3xl font-bold text-cyan-400">ENIGMA DE PSYLOGOS</h1>
        <div className="w-64 h-64 mx-auto my-4">
          <PlexusFace />
        </div>
        <h2 className="text-2xl font-semibold text-white">Crie seu Pseudônimo</h2>
        <p className="text-gray-300">Escolha um apelido único que será usado no ranking e para sua identificação anônima.</p>
        
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Digite seu nickname"
          className="w-full px-4 py-2 text-center text-white bg-transparent border-b-2 border-cyan-400 focus:outline-none focus:border-cyan-300 focus:shadow-glow-blue-sm transition-all"
        />
        
        <button 
          onClick={handleNicknameSubmit} 
          disabled={nickname.trim().length <= 2}
          className="w-full px-6 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-all duration-300 shadow-glow-blue disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none"
        >
          Iniciar Jornada
        </button>
      </div>
    </div>
  );
};

const ConsentScreen: React.FC<{ onConsent: (agreed: boolean) => void }> = ({ onConsent }) => {
  const [agreed, setAgreed] = useState(false);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in">
       <div className="w-full max-w-2xl p-8 space-y-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-cyan-400/20 shadow-glow-blue">
         <h1 className="text-2xl font-bold text-cyan-400 text-center">Bem vindo ao ENIGMA DE PSYLOGOS!</h1>
         <h2 className="text-xl font-semibold text-white text-center">Registro de Consentimento Livre e Esclarecido</h2>
         <div className="h-64 overflow-y-auto p-4 border border-cyan-400/30 rounded-lg bg-black/20 text-gray-300 text-sm">
            <p className="whitespace-pre-wrap">{RCLE_TEXT}</p>
         </div>
         <div className="flex flex-col items-center space-y-6 pt-4">
            <label className="flex items-center space-x-3 cursor-pointer group">
                <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="sr-only peer"
                    aria-describedby="consent-text"
                />
                <span className="w-6 h-6 rounded-md border-2 border-cyan-400/50 flex items-center justify-center transition-all duration-300 group-hover:border-cyan-300 peer-checked:bg-cyan-400 peer-checked:border-cyan-400 peer-checked:shadow-glow-blue-sm">
                    {agreed && (
                        <svg className="w-4 h-4 text-brand-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    )}
                </span>
                <span id="consent-text" className="text-gray-300 group-hover:text-white transition-colors">
                    Li e concordo com os termos de participação.
                </span>
            </label>
            <button
                onClick={() => onConsent(agreed)}
                disabled={!agreed}
                className="w-full max-w-xs px-6 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-all duration-300 shadow-glow-blue disabled:bg-gray-600/50 disabled:cursor-not-allowed disabled:shadow-none disabled:text-gray-400"
            >
                Continuar
            </button>
         </div>
       </div>
    </div>
  );
};

const SociodemographicQuestionnaireScreen: React.FC<{onComplete: (data: SociodemographicData) => void}> = ({ onComplete }) => {
    // ... (Mantendo o código do questionário sociodemográfico igual, pois não foi alvo de alteração de design)
    const totalSteps = 5;
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState<SociodemographicData>({
      age: '', gender: '', maritalStatus: '', education: '', occupation: '',
      continuousMedication: '', medicationDetails: '', healthDiagnosis: '', diagnosisDetails: '',
      monthlyIncome: '', platforms: [], otherPlatform: '', usagePeriod: '', dailyUsage: '',
      purpose_talk: '', purpose_share: '', purpose_watch: '', purpose_search: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({
                ...prev,
                platforms: checked ? [...prev.platforms, value] : prev.platforms.filter(p => p !== value),
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const handleRadioChange = (name: string, value: string) => {
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps - 1));
    const prevStep = () => setStep(prev => Math.max(prev - 1, 0));

    const handleSubmit = () => {
        onComplete(formData);
    };

    const renderStep = () => {
        switch(step) {
            case 0: return <Step1 formData={formData} handleChange={handleChange} handleRadioChange={handleRadioChange} />;
            case 1: return <Step2 formData={formData} handleChange={handleChange} handleRadioChange={handleRadioChange} />;
            case 2: return <Step3 formData={formData} handleRadioChange={handleRadioChange} />;
            case 3: return <Step4 formData={formData} handleChange={handleChange} handleRadioChange={handleRadioChange} />;
            case 4: return <Step5 formData={formData} handleRadioChange={handleRadioChange} />;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 animate-fade-in">
            <div className="w-full max-w-2xl p-8 space-y-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-cyan-400/20 shadow-glow-blue">
                <h2 className="text-xl font-bold text-cyan-400 text-center">Questionário Sociodemográfico</h2>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div className="bg-cyan-400 h-1.5 rounded-full" style={{width: `${((step + 1) / totalSteps) * 100}%`}}></div>
                </div>
                
                <div className="min-h-[300px] py-4">
                    {renderStep()}
                </div>

                <div className="flex justify-between items-center pt-4">
                    <button onClick={prevStep} disabled={step === 0} className="px-6 py-2 font-bold text-cyan-300 bg-transparent border border-cyan-400/50 rounded-lg hover:bg-cyan-400/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Voltar</button>
                    {step < totalSteps - 1 ? (
                        <button onClick={nextStep} className="px-6 py-2 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors shadow-glow-blue">Próximo</button>
                    ) : (
                        <button onClick={handleSubmit} className="px-6 py-2 font-bold text-brand-dark bg-green-400 rounded-lg hover:bg-green-300 transition-colors shadow-glow-blue">Finalizar</button>
                    )}
                </div>
            </div>
        </div>
    );
};

// ... (Auxiliary form components Step1, Step2 etc. kept as is for brevity but assumed present in real code)
const CustomRadio = ({name, value, label, checked, onChange}: {name:string, value:string, label:string, checked:boolean, onChange:(name:string, value:string)=>void}) => (
    <label className="flex items-center space-x-3 cursor-pointer group text-gray-300 hover:text-white">
        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${checked ? 'border-cyan-400' : 'border-gray-500 group-hover:border-cyan-500'}`}>
            {checked && <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>}
        </span>
        <span>{label}</span>
        <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(name, value)} className="sr-only" />
    </label>
);

const CustomCheckbox = ({name, value, label, checked, onChange}: {name:string, value:string, label:string, checked:boolean, onChange:React.ChangeEventHandler<HTMLInputElement>}) => (
    <label className="flex items-center space-x-3 cursor-pointer group text-gray-300 hover:text-white">
        <span className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${checked ? 'border-cyan-400 bg-cyan-400' : 'border-gray-500 group-hover:border-cyan-500'}`}>
            {checked && <svg className="w-3 h-3 text-brand-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>}
        </span>
        <span>{label}</span>
        <input type="checkbox" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
    </label>
);

const FormField: React.FC<{label: string, children: React.ReactNode}> = ({label, children}) => (
    <div className="mb-4">
        <label className="block text-cyan-300 text-sm font-bold mb-2">{label}</label>
        {children}
    </div>
);
const Step1 = ({formData, handleChange, handleRadioChange}: {formData: SociodemographicData, handleChange: any, handleRadioChange: any}) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
        <FormField label="Idade">
            <input type="number" name="age" value={formData.age} onChange={handleChange} className="form-input" placeholder="Sua idade"/>
        </FormField>
        <FormField label="Gênero">
             <div className="space-y-2">
                <CustomRadio name="gender" value="Feminino" label="Feminino" checked={formData.gender === 'Feminino'} onChange={handleRadioChange}/>
                <CustomRadio name="gender" value="Masculino" label="Masculino" checked={formData.gender === 'Masculino'} onChange={handleRadioChange}/>
                <CustomRadio name="gender" value="Outro" label="Outro" checked={formData.gender === 'Outro'} onChange={handleRadioChange}/>
                <CustomRadio name="gender" value="Prefiro não responder" label="Prefiro não responder" checked={formData.gender === 'Prefiro não responder'} onChange={handleRadioChange}/>
            </div>
        </FormField>
         <FormField label="Estado Civil">
            <div className="space-y-2">
                <CustomRadio name="maritalStatus" value="Solteiro(a)" label="Solteiro(a)" checked={formData.maritalStatus === 'Solteiro(a)'} onChange={handleRadioChange}/>
                <CustomRadio name="maritalStatus" value="Casado(a) / União estável" label="Casado(a) / União estável" checked={formData.maritalStatus === 'Casado(a) / União estável'} onChange={handleRadioChange}/>
                <CustomRadio name="maritalStatus" value="Separado(a) / Divorciado(a)" label="Separado(a) / Divorciado(a)" checked={formData.maritalStatus === 'Separado(a) / Divorciado(a)'} onChange={handleRadioChange}/>
                <CustomRadio name="maritalStatus" value="Viúvo(a)" label="Viúvo(a)" checked={formData.maritalStatus === 'Viúvo(a)'} onChange={handleRadioChange}/>
            </div>
        </FormField>
        <FormField label="Escolaridade">
             <div className="space-y-2">
                <CustomRadio name="education" value="Ensino Fundamental" label="Ensino Fundamental" checked={formData.education === 'Ensino Fundamental'} onChange={handleRadioChange}/>
                <CustomRadio name="education" value="Ensino Médio" label="Ensino Médio" checked={formData.education === 'Ensino Médio'} onChange={handleRadioChange}/>
                <CustomRadio name="education" value="Ensino Superior (em andamento)" label="Ensino Superior (em andamento)" checked={formData.education === 'Ensino Superior (em andamento)'} onChange={handleRadioChange}/>
                <CustomRadio name="education" value="Ensino Superior (concluído)" label="Ensino Superior (concluído)" checked={formData.education === 'Ensino Superior (concluído)'} onChange={handleRadioChange}/>
                <CustomRadio name="education" value="Pós-graduação / Mestrado / Doutorado" label="Pós-graduação / Mestrado / Doutorado" checked={formData.education === 'Pós-graduação / Mestrado / Doutorado'} onChange={handleRadioChange}/>
            </div>
        </FormField>
         <div className="md:col-span-2">
            <FormField label="Ocupação principal">
                <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} className="form-input" placeholder="Sua ocupação"/>
            </FormField>
        </div>
    </div>
);

const Step2 = ({formData, handleChange, handleRadioChange}: {formData: SociodemographicData, handleChange: any, handleRadioChange: any}) => (
    <div className="space-y-6">
        <FormField label="Remédio de uso contínuo">
             <div className="flex space-x-6">
                <CustomRadio name="continuousMedication" value="Sim" label="Sim" checked={formData.continuousMedication === 'Sim'} onChange={handleRadioChange}/>
                <CustomRadio name="continuousMedication" value="Não" label="Não" checked={formData.continuousMedication === 'Não'} onChange={handleRadioChange}/>
            </div>
        </FormField>
        {formData.continuousMedication === 'Sim' && (
             <FormField label="Qual(is)?">
                <input type="text" name="medicationDetails" value={formData.medicationDetails} onChange={handleChange} className="form-input" placeholder="Nome do remédio"/>
            </FormField>
        )}
        <FormField label="Diagnóstico de saúde física e/ou mental">
             <div className="flex space-x-6">
                <CustomRadio name="healthDiagnosis" value="Sim" label="Sim" checked={formData.healthDiagnosis === 'Sim'} onChange={handleRadioChange}/>
                <CustomRadio name="healthDiagnosis" value="Não" label="Não" checked={formData.healthDiagnosis === 'Não'} onChange={handleRadioChange}/>
            </div>
        </FormField>
        {formData.healthDiagnosis === 'Sim' && (
             <FormField label="Qual(is)?">
                <input type="text" name="diagnosisDetails" value={formData.diagnosisDetails} onChange={handleChange} className="form-input" placeholder="Nome do diagnóstico"/>
            </FormField>
        )}
    </div>
);

const Step3 = ({formData, handleRadioChange}: {formData: SociodemographicData, handleRadioChange: any}) => (
    <FormField label="Renda mensal aproximada">
         <div className="space-y-2">
            <CustomRadio name="monthlyIncome" value="Até 1 salário mínimo" label="Até 1 salário mínimo" checked={formData.monthlyIncome === 'Até 1 salário mínimo'} onChange={handleRadioChange}/>
            <CustomRadio name="monthlyIncome" value="De 1 a 3 salários mínimos" label="De 1 a 3 salários mínimos" checked={formData.monthlyIncome === 'De 1 a 3 salários mínimos'} onChange={handleRadioChange}/>
            <CustomRadio name="monthlyIncome" value="De 3 a 5 salários mínimos" label="De 3 a 5 salários mínimos" checked={formData.monthlyIncome === 'De 3 a 5 salários mínimos'} onChange={handleRadioChange}/>
            <CustomRadio name="monthlyIncome" value="Acima de 5 salários mínimos" label="Acima de 5 salários mínimos" checked={formData.monthlyIncome === 'Acima de 5 salários mínimos'} onChange={handleRadioChange}/>
            <CustomRadio name="monthlyIncome" value="Prefiro não informar" label="Prefiro não informar" checked={formData.monthlyIncome === 'Prefiro não informar'} onChange={handleRadioChange}/>
        </div>
    </FormField>
);

const Step4 = ({formData, handleChange, handleRadioChange}: {formData: SociodemographicData, handleChange: any, handleRadioChange: any}) => (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <FormField label="Quais redes sociais você utiliza para ver vídeos curtos?">
            <div className="space-y-2">
                <CustomCheckbox name="platforms" value="TikTok" label="TikTok" checked={formData.platforms.includes('TikTok')} onChange={handleChange} />
                <CustomCheckbox name="platforms" value="Instagram" label="Instagram" checked={formData.platforms.includes('Instagram')} onChange={handleChange} />
                <CustomCheckbox name="platforms" value="YouTube Shorts" label="YouTube Shorts" checked={formData.platforms.includes('YouTube Shorts')} onChange={handleChange} />
                <CustomCheckbox name="platforms" value="Outras" label="Outras" checked={formData.platforms.includes('Outras')} onChange={handleChange} />
            </div>
            {formData.platforms.includes('Outras') && <input type="text" name="otherPlatform" value={formData.otherPlatform} onChange={handleChange} className="form-input mt-2" placeholder="Quais?"/>}
        </FormField>
        <FormField label="Período em que mais utiliza redes sociais">
            <div className="space-y-2">
                <CustomRadio name="usagePeriod" value="Manhã" label="Manhã" checked={formData.usagePeriod === 'Manhã'} onChange={handleRadioChange}/>
                <CustomRadio name="usagePeriod" value="Tarde" label="Tarde" checked={formData.usagePeriod === 'Tarde'} onChange={handleRadioChange}/>
                <CustomRadio name="usagePeriod" value="Noite" label="Noite" checked={formData.usagePeriod === 'Noite'} onChange={handleRadioChange}/>
            </div>
        </FormField>
        <div className="md:col-span-2">
            <FormField label="Tempo médio estimado de uso diário">
                 <div className="space-y-2">
                    <CustomRadio name="dailyUsage" value="Menos de 1 hora" label="Menos de 1 hora" checked={formData.dailyUsage === 'Menos de 1 hora'} onChange={handleRadioChange}/>
                    <CustomRadio name="dailyUsage" value="1 a 2 horas" label="1 a 2 horas" checked={formData.dailyUsage === '1 a 2 horas'} onChange={handleRadioChange}/>
                    <CustomRadio name="dailyUsage" value="3 a 4 horas" label="3 a 4 horas" checked={formData.dailyUsage === '3 a 4 horas'} onChange={handleRadioChange}/>
                    <CustomRadio name="dailyUsage" value="5 a 6 horas" label="5 a 6 horas" checked={formData.dailyUsage === '5 a 6 horas'} onChange={handleRadioChange}/>
                    <CustomRadio name="dailyUsage" value="Mais de 6 horas" label="Mais de 6 horas" checked={formData.dailyUsage === 'Mais de 6 horas'} onChange={handleRadioChange}/>
                </div>
            </FormField>
        </div>
    </div>
);

const Step5 = ({formData, handleRadioChange}: {formData: SociodemographicData, handleRadioChange: any}) => {
    const purposes = [
      { name: 'purpose_talk', label: 'Conversar com amigos/família'},
      { name: 'purpose_share', label: 'Trocar vídeos com amigos/família'},
      { name: 'purpose_watch', label: 'Ver vídeos curtos (rolar o feed)'},
      { name: 'purpose_search', label: 'Buscar informações'},
    ];
    const frequencies = ['Nenhuma vez', 'Poucas vezes', 'Algumas vezes', 'Muitas vezes', 'Sempre'];
    return (
        <div>
            <h3 className="text-cyan-300 text-sm font-bold mb-2">Finalidade de uso das redes sociais</h3>
            <p className="text-gray-400 text-xs mb-4">Assinale a frequência com que utiliza para cada finalidade</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead>
                      <tr className="border-b border-cyan-400/20">
                          <th className="p-2">Finalidade</th>
                          {frequencies.map(f => <th key={f} className="p-2 text-center text-gray-400 font-normal">{f}</th>)}
                      </tr>
                  </thead>
                  <tbody>
                      {purposes.map(purpose => (
                          <tr key={purpose.name} className="border-b border-cyan-400/10">
                              <td className="p-2 text-gray-300">{purpose.label}</td>
                              {frequencies.map(freq => (
                                  <td key={freq} className="p-2 text-center">
                                      <label className="flex justify-center">
                                         <CustomRadio name={purpose.name} value={freq} label="" checked={formData[purpose.name as keyof SociodemographicData] === freq} onChange={handleRadioChange}/>
                                      </label>
                                  </td>
                              ))}
                          </tr>
                      ))}
                  </tbody>
              </table>
            </div>
        </div>
    );
};

// --- END: OnboardingScreen Component ---

// --- START: DashboardScreen Component ---

type InstrumentFlowState = {
  ping: { day: number; ping: number };
  type: 'regular' | 'end_of_day';
  step: 'sam' | 'feed_context' | 'panas_contextual' | 'panas_daily' | 'end_of_day_log';
  data: Partial<InstrumentResponse>;
} | null;


const DashboardScreen: React.FC<{ gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>, onLogout: () => void }> = ({ gameState, setGameState, onLogout }) => {
  const { user, pings } = gameState;
  const [highlightedPing, setHighlightedPing] = useState<{ day: number, ping: number } | null>(null);
  const [isRcleModalOpen, setIsRcleModalOpen] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSociodemographicModalOpen, setIsSociodemographicModalOpen] = useState(false);
  const [instrumentFlow, setInstrumentFlow] = useState<InstrumentFlowState>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Helper for current day index (0-6)
  const days = [1, 2, 3, 4, 5, 6, 7];
  // Calculate current day based on pings logic or start date. 
  // Simple heuristic: find the first day with a pending ping.
  const getCurrentDayIndex = () => {
      for(let i=0; i<7; i++) {
          if(pings[i].some(s => s === 'pending' || s === 'missed')) return i;
      }
      return 6; // Finished or last day
  };
  const currentDayIndex = getCurrentDayIndex();

  useEffect(() => {
    const findNextPendingPing = () => {
      for (let day = 0; day < pings.length; day++) {
        for (let ping = 0; ping < pings[day].length; ping++) {
          if (pings[day][ping] === 'pending') {
            return { day, ping };
          }
        }
      }
      return null;
    };
    setHighlightedPing(findNextPendingPing());
  }, [pings]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
            setIsProfileMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const startInstrumentFlow = useCallback((targetPing: { day: number, ping: number }) => {
      const isEndOfDay = targetPing.ping === 6;

      if (isEndOfDay) {
          setInstrumentFlow({
              ping: targetPing,
              type: 'end_of_day',
              step: 'panas_daily',
              data: {
                  timestamp: new Date().toISOString(),
                  pingDay: targetPing.day,
                  pingIndex: targetPing.ping,
                  type: 'end_of_day',
              },
          });
      } else {
          setInstrumentFlow({
              ping: targetPing,
              type: 'regular',
              step: 'sam',
              data: {
                  timestamp: new Date().toISOString(),
                  pingDay: targetPing.day,
                  pingIndex: targetPing.ping,
                  type: 'regular',
              },
          });
      }
  }, []);
  
  const handleInstrumentFlowFinish = (finalResponseData: InstrumentResponse) => {
    if (!instrumentFlow) return;
    const { day, ping } = instrumentFlow.ping;

    setGameState(prev => {
        const newPings = prev.pings.map(row => [...row]);
        newPings[day][ping] = 'completed';

        const newXp = newPings.flat().reduce((acc, status, index) => {
            if (status === 'completed') {
                const isStar = (index + 1) % 7 === 0;
                return acc + (isStar ? 100 : 50);
            }
            return acc;
        }, 0);

        const newLevel = calculateLevel(newXp);
        
        return {
            ...prev,
            pings: newPings,
            responses: [...prev.responses, finalResponseData],
            user: {
                ...prev.user,
                points: newXp,
                level: newLevel,
            }
        };
    });
    setInstrumentFlow(null);
  };
  
  const handleInstrumentStep = (stepData: Partial<InstrumentResponse>) => {
    if (!instrumentFlow) return;

    const newData = { ...instrumentFlow.data, ...stepData };

    if (instrumentFlow.type === 'regular') {
        if (instrumentFlow.step === 'sam') {
            setInstrumentFlow({ ...instrumentFlow, step: 'feed_context', data: newData });
        } else if (instrumentFlow.step === 'feed_context') {
            setInstrumentFlow({ ...instrumentFlow, step: 'panas_contextual', data: newData });
        } else if (instrumentFlow.step === 'panas_contextual') {
            handleInstrumentFlowFinish(newData as InstrumentResponse);
        }
    } else { // end_of_day
        if (instrumentFlow.step === 'panas_daily') {
            setInstrumentFlow({ ...instrumentFlow, step: 'end_of_day_log', data: newData });
        } else if (instrumentFlow.step === 'end_of_day_log') {
            handleInstrumentFlowFinish(newData as InstrumentResponse);
        }
    }
  };


  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setGameState(prev => ({
          ...prev,
          user: { ...prev.user, avatar: reader.result as string }
        }));
      };
      reader.readAsDataURL(file);
    }
    setIsProfileMenuOpen(false);
  };
  
  const handleRemoveAvatar = () => {
    setGameState(prev => ({
      ...prev,
      user: { ...prev.user, avatar: null }
    }));
    setIsProfileMenuOpen(false);
  };

  const handleTimerEnd = useCallback(() => {
  }, []);

  const notificationTimes = ['9h', '11h', '13h', '15h', '17h', '19h', '21h'];
  const { level, points: totalXp } = user;
  const currentLevelXpStart = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextLevelXpTarget = LEVEL_THRESHOLDS[level] ?? (LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]);
  const xpForThisLevel = nextLevelXpTarget - currentLevelXpStart;
  const xpIntoLevel = totalXp - currentLevelXpStart;
  const progressPercentage = (xpForThisLevel > 0 && xpIntoLevel >= 0) ? (xpIntoLevel / xpForThisLevel) * 100 : 0;

  const pingIconClasses = "transition-transform duration-150 ease-in-out";

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto animate-fade-in pb-20">
      {instrumentFlow && (
        <InstrumentModal 
          flow={instrumentFlow}
          onStep={handleInstrumentStep}
          onCancel={() => setInstrumentFlow(null)}
        />
      )}
      {isRcleModalOpen && <RcleModal onClose={() => setIsRcleModalOpen(false)} />}
      {isSociodemographicModalOpen && gameState.sociodemographicData && (
        <SociodemographicModal 
            onClose={() => setIsSociodemographicModalOpen(false)}
            data={gameState.sociodemographicData}
        />
      )}
      {isPerformanceModalOpen && (
        <PerformanceModal onClose={() => setIsPerformanceModalOpen(false)} gameState={gameState} />
      )}

      {/* --- GAMIFIED HEADER --- */}
      <div className="bg-gradient-to-r from-brand-purple/20 to-brand-blue/10 p-6 rounded-2xl border border-white/10 backdrop-blur-sm relative overflow-hidden mb-8 shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-10">
                <IconTrophy className="w-32 h-32" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                  <div className="relative" ref={profileMenuRef}>
                       <button
                        onClick={() => setIsProfileMenuOpen(prev => !prev)}
                        className="relative group w-16 h-16 rounded-full bg-slate-800 border-2 border-cyan-400 flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:border-cyan-300 hover:shadow-glow-blue-sm"
                      >
                        {user.avatar ? (
                          <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-8 h-8 text-cyan-400" />
                        )}
                      </button>
                      {isProfileMenuOpen && (
                        <ProfileMenu
                          onUpload={() => fileInputRef.current?.click()}
                          onRemove={handleRemoveAvatar}
                          onViewRcle={() => { setIsRcleModalOpen(true); setIsProfileMenuOpen(false); }}
                          onViewPerformance={() => { setIsPerformanceModalOpen(true); setIsProfileMenuOpen(false); }}
                          onViewData={() => { setIsSociodemographicModalOpen(true); setIsProfileMenuOpen(false); }}
                          onLogout={onLogout}
                          hasAvatar={!!user.avatar}
                        />
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        accept="image/png, image/jpeg"
                        className="hidden"
                      />
                  </div>
                  <div>
                      <h2 className="text-white font-bold text-xl">{user.nickname}</h2>
                      <p className="text-xs text-cyan-300 font-medium tracking-wide">Nível {user.level} • Mente Curiosa</p>
                  </div>
              </div>

              <div className="flex-grow md:max-w-xs">
                  <div className="flex items-center justify-between text-yellow-400 font-bold text-sm mb-1">
                       <div className="flex items-center gap-1"><IconTrophy className="w-4 h-4"/> <span>{totalXp} XP</span></div>
                       <span className="text-xs text-gray-400 font-normal">{nextLevelXpTarget} XP para Lvl {level + 1}</span>
                  </div>
                  <div className="w-full h-3 bg-slate-900/50 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 shadow-glow-blue-sm relative" style={{width: `${progressPercentage}%`}}>
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                      </div>
                  </div>
              </div>

              <div className="flex items-center justify-center bg-slate-900/40 p-2 rounded-xl border border-white/10">
                   <CountdownTimer onTimerEnd={handleTimerEnd} />
              </div>
          </div>
      </div>

      <main className="space-y-8">
        
        {/* --- JOURNEY TIMELINE --- */}
        <div className="md:col-span-3">
             <div className="flex justify-between items-end mb-4 px-1">
                 <h3 className="text-sm text-gray-400 uppercase tracking-widest font-semibold">Sua Jornada</h3>
                 <span className="text-xs text-cyan-400 font-medium">Dia {currentDayIndex + 1} de 7</span>
            </div>
            
            <div className="flex justify-between items-center relative px-2">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -z-10 transform -translate-y-1/2"></div>
                
                {days.map((day, idx) => {
                    const status = idx < currentDayIndex ? 'completed' : idx === currentDayIndex ? 'current' : 'locked';
                    return (
                        <div key={day} className="flex flex-col items-center gap-2 relative group">
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-xs md:text-sm font-bold border-2 transition-all duration-300 z-10
                                ${status === 'completed' ? 'bg-cyan-900/80 border-cyan-500 text-cyan-400' : 
                                  status === 'current' ? 'bg-cyan-400 border-cyan-400 text-brand-dark shadow-glow-blue scale-110' : 
                                  'bg-slate-900 border-slate-700 text-slate-600'}`}>
                                {status === 'completed' ? <IconCheck className="w-4 h-4" /> : day}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* --- MAIN PINGS GRID (STYLED AS CARDS) --- */}
        <Card>
            <h3 className="card-title text-center mb-6">Missões de Hoje (Pings)</h3>
            <div className="grid grid-cols-7 gap-2 md:gap-4 items-center text-center">
                {notificationTimes.map(time => (
                    <div key={time} className="font-semibold text-xs text-cyan-300/80">{time}</div>
                ))}
                {pings.map((day, dayIndex) => (
                  <React.Fragment key={dayIndex}>
                    {/* Only show current day for clarity in mobile, or visually dim others. For now showing all 7 days grid but highlighting current row */}
                    {day.map((status, pingIndex) => {
                       const isLastColumn = pingIndex === notificationTimes.length - 1;
                       const isHighlighted = highlightedPing?.day === dayIndex && highlightedPing?.ping === pingIndex;
                       const isClickable = isHighlighted && !instrumentFlow;
                       const isCurrentDayRow = dayIndex === currentDayIndex;
                       
                       const Wrapper = isClickable ? 'button' : 'div';
                       const wrapperProps = isClickable ? {
                           onClick: () => startInstrumentFlow({ day: dayIndex, ping: pingIndex }),
                           className: `h-10 w-10 md:h-12 md:w-12 flex items-center justify-center relative transition-transform hover:scale-110 cursor-pointer z-10`,
                           'aria-label': isLastColumn ? 'Responder questionário de fim do dia' : 'Responder ping regular'
                       } : {
                           className: `h-8 w-8 md:h-10 md:w-10 flex items-center justify-center relative z-10`
                       };

                       return (
                          <div 
                            key={`${dayIndex}-${pingIndex}`} 
                            className={`flex items-center justify-center relative h-12 ${!isCurrentDayRow ? 'opacity-30 grayscale' : ''}`}
                          >
                             {isHighlighted && <div className="absolute inset-0 rounded-full bg-cyan-400/50 animate-ping-glow w-full h-full m-auto"></div>}
                             
                             {/* @ts-ignore */}
                             <Wrapper {...wrapperProps}>
                                {isLastColumn ? (
                                    status === 'completed' ? <StarIcon className={`w-6 h-6 text-yellow-400 ${pingIconClasses}`} /> :
                                    status === 'missed' ? <div className={`w-3 h-1 bg-gray-500 rounded-full ${pingIconClasses}`}></div> :
                                    <StarIcon className={`w-6 h-6 ${isClickable ? 'text-cyan-300 drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]' : 'text-gray-700'} ${pingIconClasses}`} />
                                ) : (
                                    status === 'completed' ? <div className={`w-4 h-4 md:w-5 md:h-5 rounded-full bg-green-400 border border-green-300 shadow-[0_0_10px_rgba(74,222,128,0.5)] ${pingIconClasses}`}></div> :
                                    status === 'missed' ? <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full bg-red-900 border border-red-800 ${pingIconClasses}`}></div> :
                                    <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full border ${isClickable ? 'bg-cyan-400 border-cyan-300 shadow-glow-blue' : 'bg-slate-800 border-slate-700'} ${pingIconClasses}`}></div>
                                )}
                            </Wrapper>
                          </div>
                       );
                    })}
                  </React.Fragment>
                ))}
            </div>
            <div className="flex justify-center gap-4 mt-6 text-xs text-gray-500">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-400"></div>Concluído</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-cyan-400 shadow-glow-blue-sm"></div>Disponível</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-800 border border-slate-700"></div>Pendente</div>
            </div>
        </Card>

      </main>
      <style>{`
        .form-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          color: white;
          background-color: rgba(0, 255, 255, 0.05);
          border: 1px solid rgba(0, 255, 255, 0.2);
          border-radius: 0.375rem;
          transition: all 0.2s;
        }
        .form-input:focus {
          outline: none;
          border-color: rgba(0, 255, 255, 0.6);
          box-shadow: 0 0 8px rgba(0, 255, 255, 0.4), 0 0 3px rgba(0, 255, 255, 0.6);
        }
        textarea.form-input {
            min-height: 80px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2); 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 255, 255, 0.2); 
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 255, 255, 0.4); 
        }
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes fade-in-down {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slow-spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-fade-in-down { animation: fade-in-down 0.5s ease-out; }
        .animate-slow-spin-slow { animation: slow-spin-slow 20s linear infinite; }
        .animate-ping-glow { animation: ping-glow 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
        @keyframes ping-glow { 0%, 100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.5); opacity: 0; } }
      `}</style>
    </div>
  );
};

// --- END: DashboardScreen Component ---


// --- START: Reusable Components & Icons ---

const PodiumItem: React.FC<{ player: {nickname: string, points: number}, rank: number, isCurrentUser: boolean }> = ({ player, rank, isCurrentUser }) => {
    // ... (Keeping implementation)
    const rankStyles: {[key: number]: {
        height: string,
        bg: string,
        border: string,
        text: string,
        shadow: string,
    }} = {
        1: { height: 'h-32', bg: 'bg-yellow-500/20', border: 'border-yellow-400', text: 'text-yellow-300', shadow: 'shadow-yellow-400/50' },
        2: { height: 'h-28', bg: 'bg-gray-400/20', border: 'border-gray-400', text: 'text-gray-300', shadow: 'shadow-gray-400/30' },
        3: { height: 'h-24', bg: 'bg-orange-500/20', border: 'border-orange-400', text: 'text-orange-300', shadow: 'shadow-orange-400/40' },
    };

    const style = rankStyles[rank];
    const userHighlight = isCurrentUser ? '!border-cyan-400 !bg-cyan-500/30 shadow-glow-blue' : '';

    return (
        <div className={`flex flex-col items-center justify-end text-center p-2 w-1/3 rounded-t-lg transition-all ${style.height} ${style.bg} ${style.border} ${userHighlight} border-b-0`}>
             <TrophyIcon rank={rank} className="w-6 h-6 mb-1" />
            <span className={`font-bold text-sm truncate w-full ${style.text}`}>{player.nickname}</span>
            <span className={`font-mono text-xs ${style.text}`}>{player.points}</span>
        </div>
    );
};


const Modal: React.FC<{onClose: () => void, children: React.ReactNode, className?: string}> = ({onClose, children, className}) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className={`bg-slate-900 border border-cyan-400/30 rounded-2xl shadow-glow-blue w-full relative ${className}`} onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors" aria-label="Fechar modal">
                    <XIcon className="w-6 h-6" />
                </button>
                {children}
            </div>
        </div>
    );
};

const RcleModal: React.FC<{onClose: () => void}> = ({onClose}) => {
    return (
        <Modal onClose={onClose} className="max-w-2xl">
            <div className="p-8">
                 <h2 className="text-2xl font-bold text-cyan-400 text-center mb-4">Registro de Consentimento Livre e Esclarecido</h2>
                 <div className="h-96 overflow-y-auto p-4 border border-cyan-400/30 rounded-lg bg-black/20 text-gray-300 text-sm">
                    <p className="whitespace-pre-wrap">{RCLE_TEXT}</p>
                 </div>
            </div>
        </Modal>
    );
};

const SociodemographicModal: React.FC<{onClose: () => void, data: SociodemographicData}> = ({onClose, data}) => {
    const DataRow = ({label, value}: {label:string, value:string|string[]|undefined|null}) => (
      value ? (
        <div className="py-2 border-b border-cyan-400/10">
            <dt className="text-sm font-semibold text-cyan-300">{label}</dt>
            <dd className="text-gray-300">{Array.isArray(value) ? value.join(', ') : value}</dd>
        </div>
      ) : null
    );

    return (
        <Modal onClose={onClose} className="max-w-2xl">
            <div className="p-8">
                 <h2 className="text-2xl font-bold text-cyan-400 text-center mb-4">Meus Dados Sociodemográficos</h2>
                 <div className="h-96 overflow-y-auto p-4 border border-cyan-400/30 rounded-lg bg-black/20 text-gray-300 text-sm">
                    <dl>
                        <DataRow label="Idade" value={`${data.age} anos`} />
                        <DataRow label="Gênero" value={data.gender} />
                        <DataRow label="Estado Civil" value={data.maritalStatus} />
                        <DataRow label="Escolaridade" value={data.education} />
                        <DataRow label="Ocupação Principal" value={data.occupation} />
                        <DataRow label="Uso de medicação contínua" value={data.continuousMedication} />
                        {data.continuousMedication === 'Sim' && <DataRow label="Medicação(ões)" value={data.medicationDetails} />}
                        <DataRow label="Diagnóstico de saúde" value={data.healthDiagnosis} />
                        {data.healthDiagnosis === 'Sim' && <DataRow label="Diagnóstico(s)" value={data.diagnosisDetails} />}
                        <DataRow label="Renda Mensal" value={data.monthlyIncome} />
                        <DataRow label="Plataformas de vídeos curtos" value={data.platforms.includes('Outras') ? [...data.platforms.filter(p=>p!=='Outras'), data.otherPlatform] : data.platforms} />
                        <DataRow label="Período de maior uso" value={data.usagePeriod} />
                        <DataRow label="Tempo de uso diário" value={data.dailyUsage} />
                        <DataRow label="Finalidade: Conversar" value={data.purpose_talk} />
                        <DataRow label="Finalidade: Trocar vídeos" value={data.purpose_share} />
                        <DataRow label="Finalidade: Ver vídeos curtos" value={data.purpose_watch} />
                        <DataRow label="Finalidade: Buscar informações" value={data.purpose_search} />
                    </dl>
                 </div>
            </div>
        </Modal>
    );
};

const PerformanceModal: React.FC<{onClose: () => void, gameState: GameState}> = ({onClose, gameState}) => {
    // ... (Performance Modal code kept as is)
    const userXpHistory = gameState.pings.flat().reduce((acc, status, index) => {
        const lastXp = acc.length > 0 ? acc[acc.length - 1] : 0;
        let currentXp = lastXp;
        if (status === 'completed') {
            const isStar = (index + 1) % 7 === 0;
            currentXp += (isStar ? 100 : 50);
        }
        acc.push(currentXp);
        return acc;
    }, [] as number[]);

    const totalPings = 49;
    while(userXpHistory.length < totalPings) {
        userXpHistory.push(userXpHistory[userXpHistory.length-1] ?? 0);
    }

    const avgXp = MOCK_PLAYERS.reduce((sum, p) => sum + p.points, 0) / MOCK_PLAYERS.length;
    const allPlayers = [...MOCK_PLAYERS, { nickname: gameState.user.nickname, points: gameState.user.points }];
    const maxXp = Math.max(...allPlayers.map(p => p.points));
    const chartMaxY = Math.max(maxXp, avgXp, ...userXpHistory, 1) * 1.1;

    const width = 500, height = 300;
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const toPath = (data: number[]) => {
        if (data.length === 0) return "";
        return "M" + data.map((p, i) => {
            const x = (i / (Math.max(1, totalPings - 1))) * chartWidth;
            const y = chartHeight - (p / Math.max(1, chartMaxY)) * chartHeight;
            return `${x.toFixed(2)},${y.toFixed(2)}`;
        }).join(" L");
    };
    
    const toAreaPath = (data: number[]) => {
        const linePath = toPath(data);
        if (!linePath.startsWith("M")) return "";
        return `${linePath} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`;
    };

    const userLinePath = toPath(userXpHistory);
    const userAreaPath = toAreaPath(userXpHistory);

    const numTicks = 5;
    const yTicks = Array.from({ length: numTicks + 1 }, (_, i) => {
        const value = (chartMaxY / numTicks) * i;
        const yPos = chartHeight - (value / Math.max(1, chartMaxY)) * chartHeight;
        return { value, y: yPos };
    });

    return (
        <Modal onClose={onClose} className="max-w-3xl">
             <div className="p-6 sm:p-8">
                 <h2 className="text-2xl font-bold text-cyan-400 text-center mb-6">Resumo de Desempenho</h2>
                 <div className="flex flex-col items-center">
                    <div className="w-full">
                        <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
                            <defs>
                                <linearGradient id="userAreaGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#00ffff" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#00ffff" stopOpacity="0" />
                                </linearGradient>
                                <filter id="lineGlow" x="-50%" y="-50%" width="200%" height="200%">
                                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                  <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                  </feMerge>
                                </filter>
                            </defs>
                            <g transform={`translate(${margin.left}, ${margin.top})`}>
                                {yTicks.map(tick => (
                                    <g key={tick.value} className="text-gray-500 text-xs">
                                        <line 
                                            x1="0" y1={tick.y} 
                                            x2={chartWidth} y2={tick.y} 
                                            stroke="currentColor" 
                                            strokeWidth="0.5" 
                                            strokeDasharray="2 4"
                                            opacity="0.3"
                                        />
                                        <text 
                                            x="-10" y={tick.y} 
                                            textAnchor="end" 
                                            dominantBaseline="middle"
                                            fill="currentColor"
                                        >
                                            {Math.round(tick.value)}
                                        </text>
                                    </g>
                                ))}
                                <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#6b7280" strokeWidth="1" />
                                <line x1="0" y1="0" x2="0" y2={chartHeight} stroke="#6b7280" strokeWidth="1" />
                                <text x={chartWidth / 2} y={chartHeight + 40} textAnchor="middle" fill="#9ca3af" fontSize="14">Pings ao longo de 7 dias</text>
                                <text transform={`rotate(-90)`} x={-chartHeight / 2} y={-45} textAnchor="middle" fill="#9ca3af" fontSize="14">XP Acumulado</text>
                                <line x1="0" y1={chartHeight - (maxXp / Math.max(1, chartMaxY)) * chartHeight} x2={chartWidth} y2={chartHeight - (maxXp / Math.max(1, chartMaxY)) * chartHeight} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" opacity="0.6" />
                                <line x1="0" y1={chartHeight - (avgXp / Math.max(1, chartMaxY)) * chartHeight} x2={chartWidth} y2={chartHeight - (avgXp / Math.max(1, chartMaxY)) * chartHeight} stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4 2" />
                                <path d={userAreaPath} fill="url(#userAreaGradient)" />
                                <path d={userLinePath} fill="none" stroke="#00ffff" strokeWidth="2.5" filter="url(#lineGlow)" />
                            </g>
                        </svg>
                    </div>
                 </div>
             </div>
        </Modal>
    );
};

const ProfileMenu: React.FC<{onUpload: () => void, onRemove: () => void, onViewRcle: () => void, onViewPerformance: () => void, onViewData: () => void, onLogout: () => void, hasAvatar: boolean}> = 
  ({onUpload, onRemove, onViewRcle, onViewPerformance, onViewData, onLogout, hasAvatar}) => {
  const baseClass = "flex items-center space-x-3 w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-cyan-400/20 hover:text-cyan-300 transition-colors rounded-md";
  return (
      <div className="absolute top-full mt-2 w-56 bg-slate-800/90 backdrop-blur-md border border-cyan-400/20 rounded-lg shadow-glow-blue p-2 z-20">
          <button onClick={onUpload} className={baseClass}><CameraIcon className="w-4 h-4" /> <span>Alterar Avatar</span></button>
          {hasAvatar && <button onClick={onRemove} className={baseClass}><TrashIcon className="w-4 h-4" /> <span>Remover Avatar</span></button>}
          <div className="h-px bg-cyan-400/20 my-1"></div>
          <button onClick={onViewPerformance} className={baseClass}><ChartBarIcon className="w-4 h-4" /> <span>Desempenho</span></button>
          <button onClick={onViewData} className={baseClass}><IdentificationIcon className="w-4 h-4" /> <span>Meus Dados</span></button>
          <button onClick={onViewRcle} className={baseClass}><DocumentTextIcon className="w-4 h-4" /> <span>Ver Termos</span></button>
          <div className="h-px bg-cyan-400/20 my-1"></div>
          <button onClick={onLogout} className={`${baseClass} text-red-400 hover:text-red-300 hover:bg-red-500/20`}><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg> <span>Sair</span></button>
      </div>
  );
};

const CountdownTimer: React.FC<{ onTimerEnd: () => void }> = ({ onTimerEnd }) => {
    const [timeLeft, setTimeLeft] = useState('');
    const pingHours = [9, 11, 13, 15, 17, 19, 21];

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            let nextPingDate = new Date();
            const nextPingHour = pingHours.find(h => h > now.getHours());

            if (nextPingHour !== undefined) {
                nextPingDate.setHours(nextPingHour, 0, 0, 0);
            } else { 
                nextPingDate.setDate(now.getDate() + 1);
                nextPingDate.setHours(pingHours[0], 0, 0, 0);
            }

            const diff = nextPingDate.getTime() - now.getTime();
            const hours = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
            const minutes = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
            const seconds = Math.max(0, Math.floor((diff % (1000 * 60)) / 1000));
            
            setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="text-center w-24">
            <div className="text-[10px] text-cyan-300/80 uppercase">Próximo Ping</div>
            <div className="font-mono text-lg text-white font-bold">{timeLeft}</div>
        </div>
    );
};

const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => {
  return (
    <div className={`bg-slate-900/50 backdrop-blur-sm p-6 rounded-2xl border border-cyan-400/20 shadow-lg ${className}`}>
      {children}
    </div>
  );
};

const PlexusFace = () => {
    // ... (Keeping complex PlexusFace implementation)
  const points = [
    {x: 125, y: 250}, {x: 155, y: 240}, {x: 180, y: 220}, {x: 200, y: 195}, {x: 212, y: 165}, // 0-4 Chin Right
    {x: 215, y: 135}, {x: 212, y: 105}, {x: 200, y: 75}, {x: 180, y: 50}, {x: 95, y: 30}, {x: 125, y: 20}, // 5-10 Head top right
    {x: 95, y: 30}, {x: 70, y: 50}, {x: 50, y: 75}, {x: 38, y: 105}, {x: 35, y: 135}, // 11-15 Head top left
    {x: 38, y: 165}, {x: 50, y: 195}, {x: 70, y: 220}, {x: 95, y: 240}, {x: 125, y: 250}, // 16-20 Chin Left
    {x: 125, y: 228}, {x: 150, y: 220}, {x: 170, y: 200}, {x: 125, y: 235}, // 21-24 Mouth right side
    {x: 100, y: 220}, {x: 80, y: 200}, {x: 125, y: 235}, {x: 125, y: 228}, // 25-28 Mouth left side
    {x: 125, y: 185}, {x: 135, y: 175}, {x: 155, y: 170}, {x: 125, y: 205}, // 29-32 Nose right
    {x: 115, y: 175}, {x: 95, y: 170}, {x: 125, y: 205}, {x: 125, y: 185}, // 33-36 Nose left
    {x: 165, y: 140}, {x: 180, y: 130}, {x: 150, y: 120}, {x: 165, y: 110}, // 37-40 Right Eye
    {x: 85, y: 140}, {x: 70, y: 130}, {x: 100, y: 120}, {x: 85, y: 110}, // 41-44 Left Eye
    {x: 70, y: 80}, {x: 180, y: 80}, {x: 100, y: 50}, {x: 150, y: 50}, // 45-48 Forehead
    {x: 50, y: 150}, {x: 200, y: 150}, {x: 80, y: 180}, {x: 170, y: 180}, // 49-52 Cheeks
    {x: 220, y: 40}, {x: 235, y: 55}, {x: 225, y: 70}, {x: 25, y: 50}, {x: 15, y: 70}, {x: 30, y: 85},    
    {x: 220, y: 190}, {x: 210, y: 210}, {x: 230, y: 205},{x: 20, y: 200}, {x: 30, y: 220}, {x: 45, y: 215},  
    {x: 185, y: 15}, {x: 200, y: 25}, {x: 180, y: 35}, {x: 65, y: 15}, {x: 50, y: 25}, {x: 70, y: 35},      
  ];
  const triangles = [
    [10, 49, 50], [11, 50, 49], [12, 46, 45], [13, 45, 46], [13, 14, 45], [14, 15, 45], [15, 16, 51], [16, 17, 51], [17, 18, 51], [18, 19, 20],
    [37, 38, 39], [37, 40, 39], [38, 40, 39], [41, 42, 43], [41, 44, 43], [42, 44, 43], [29, 30, 31], [30, 32, 31], [33, 34, 35], [34, 36, 35],
    [37, 50, 38], [38, 50, 52], [38, 52, 40], [40, 52, 39], [41, 51, 42], [42, 51, 49], [42, 49, 44], [44, 49, 43], [47, 48, 10], [47, 50, 10],
    [47, 48, 50], [45, 46, 12], [45, 13, 14], [21, 27, 23], [27, 22, 23], [21, 23, 22], [23, 22, 24], [24, 22, 25], [25, 22, 26], [20, 21, 27],
    [20, 27, 26], [19, 20, 26], [1, 2, 22], [2, 23, 22], [3, 4, 52], [4, 5, 52], [5, 6, 50], [6, 7, 50], [7, 8, 48], [8, 9, 48], [9, 10, 50],
    [11, 12, 46], [12, 13, 46], [14, 45, 15], [15, 51, 16], [16, 51, 49], [16, 49, 51], [16, 51, 17], [17, 51, 52], [17, 52, 18], [18, 52, 23],
    [18, 23, 19], [19, 23, 26], [19, 26, 20], [20, 26, 25], [20, 25, 21], [20, 21, 27], [41, 6, 49], [41, 5, 6], [42, 5, 49], [4, 5, 52],
    [3, 4, 52], [4, 52, 40], [40, 3, 52], [2, 3, 40], [1, 2, 23], [1, 23, 22], [0, 1, 22], [0, 19, 22], [19, 0, 26],
    [53, 54, 55], [56, 57, 58], [59, 60, 61], [62, 63, 64], [65, 66, 67], [68, 69, 70]
  ];

  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !gRef.current) return;
    const svg = svgRef.current;
    const g = gRef.current;
    const { width, height, left, top } = svg.getBoundingClientRect();
    const mouseX = e.clientX - left;
    const mouseY = e.clientY - top;

    const centerX = width / 2;
    const centerY = height / 2;
    
    const dx = (mouseX - centerX) / centerX;
    const dy = (mouseY - centerY) / centerY;

    const tiltX = dy * -10; 
    const tiltY = dx * 10;
    
    g.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
  };
  
  const handleMouseLeave = () => {
    if (gRef.current) {
      gRef.current.style.transform = `perspective(800px) rotateX(0deg) rotateY(0deg)`;
    }
  };

  return (
    <svg 
      ref={svgRef} 
      onMouseMove={handleMouseMove} 
      onMouseLeave={handleMouseLeave}
      viewBox="0 0 250 270" 
      xmlns="http://www.w3.org/2000/svg" 
      className="opacity-0 animate-fadeIn" style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}>
       <style>
        {`
          @keyframes fadeIn { to { opacity: 1; } }
          @keyframes pulse { 0% { r: 4; opacity: 0.8; } 50% { r: 8; opacity: 1; } 100% { r: 4; opacity: 0.8; } }
          @keyframes slowFloat { 0% { transform: translate(0, 0); } 25% { transform: translate(1px, 2px); } 50% { transform: translate(-1px, -2px); } 75% { transform: translate(1px, -1px); } 100% { transform: translate(0, 0); } }
          @keyframes ping-glow { 0%, 100% { transform: scale(1); opacity: 0.7; } 50% { transform: scale(1.5); opacity: 0; } }
          .pulse-node { animation: pulse 3s infinite ease-in-out; }
          .debris { animation: slowFloat 8s infinite ease-in-out; }
          .animate-ping-glow { animation: ping-glow 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
          .plexus-group { transition: transform 0.2s ease-out; }
        `}
      </style>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
          <feMerge> <feMergeNode in="coloredBlur"/> <feMergeNode in="SourceGraphic"/> </feMerge>
        </filter>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor: '#7df9ff', stopOpacity:1}} />
            <stop offset="100%" style={{stopColor: '#00ffff', stopOpacity:1}} />
        </linearGradient>
        <radialGradient id="eyeGlow">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="40%" stopColor="#00ffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g ref={gRef} filter="url(#glow)" className="plexus-group" style={{ transformOrigin: 'center' }}>
        {triangles.map((tri, i) => (
          <polygon
            key={i}
            points={`${points[tri[0]].x},${points[tri[0]].y} ${points[tri[1]].x},${points[tri[1]].y} ${points[tri[2]].x},${points[tri[2]].y}`}
            fill="rgba(0, 255, 255, 0.05)"
            stroke="url(#gradient)"
            strokeWidth="0.3"
            className={i >= triangles.length - 6 ? 'debris' : ''}
            style={{animationDelay: `${(i % 6) * 0.5}s`}}
          />
        ))}
        {points.map((p, i) => ( <circle key={i} cx={p.x} cy={p.y} r="1" fill="url(#gradient)" opacity="0.8" /> ))}
        <circle cx="168" cy="125" r="8" fill="url(#eyeGlow)" className="pulse-node" />
        <circle cx="82" cy="125" r="8" fill="url(#eyeGlow)" className="pulse-node" style={{ animationDelay: '0.5s' }} />
      </g>
    </svg>
  );
};

const UserIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /> <circle cx="12" cy="7" r="4" />
  </svg>
);
const CameraIcon = ({ className = '' }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path> <circle cx="12" cy="13" r="4"></circle> </svg> );
const TrashIcon = ({ className = '' }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <polyline points="3 6 5 6 21 6"></polyline> <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path> </svg> );
const DocumentTextIcon = ({ className = '' }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path> <polyline points="14 2 14 8 20 8"></polyline> <line x1="16" y1="13" x2="8" y2="13"></line> <line x1="16" y1="17" x2="8" y2="17"></line> <polyline points="10 9 9 9 8 9"></polyline> </svg> );
const ChartBarIcon = ({ className = '' }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M3 3v18h18" /> <path d="m18 9-5 5-4-4-3 3" /> </svg> );
const IdentificationIcon = ({ className = '' }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path> <path d="M7 12h2" /> <path d="M7 16h5" /> <path d="M13 16h4" /> <path d="M14 11V7h-4v4"></path> </svg> );
const BellIcon = ({ className = '' }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /> <path d="M13.73 21a2 2 0 0 1-3.46 0" /> </svg> );
const PlusIcon = ({ className = '' }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <line x1="12" y1="5" x2="12" y2="19"></line> <line x1="5" y1="12" x2="19" y2="12"></line> </svg> );
const StarIcon = ({ className = '' }: { className?: string }) => ( <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"> <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon> </svg> );
const CheckCircleIcon = ({ className = '' }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path> <polyline points="22 4 12 14.01 9 11.01"></polyline> </svg> );
const XCircleIcon = ({ className = '' }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <circle cx="12" cy="12" r="10"></circle> <line x1="15" y1="9" x2="9" y2="15"></line> <line x1="9" y1="9" x2="15" y2="15"></line> </svg> );
const XIcon = ({ className = '' }: { className?: string }) => ( <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <line x1="18" y1="6" x2="6" y2="18"></line> <line x1="6" y1="6" x2="18" y2="18"></line> </svg> );
const TrophyIcon = ({ className = '', rank }: { className?: string, rank: number }) => { const colorClass = ({1: 'text-yellow-400', 2: 'text-gray-300', 3: 'text-orange-400'}[rank] || 'text-gray-500'); return ( <svg className={`${className} ${colorClass}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round"> <path d="M12 2C8.686 2 6 4.686 6 8c0 2.21 1.79 4 4 4h4c2.21 0 4-1.79 4-4 0-3.314-2.686-6-6-6zm0 14c-2.21 0-4 1.79-4 4h8c0-2.21-1.79-4-4-4zm0-10c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2zM6 20h12v2H6v-2z"/> </svg> ); };

// --- END: Reusable Components & Icons ---

// --- START: Instrument Components ---

const InstrumentModal: React.FC<{
    flow: InstrumentFlowState;
    onStep: (data: Partial<InstrumentResponse>) => void;
    onCancel: () => void;
}> = ({ flow, onCancel, onStep }) => {
    if (!flow) return null;

    const REGULAR_FLOW_SEQUENCE = ['sam', 'feed_context', 'panas_contextual'];
    const EOD_FLOW_SEQUENCE = ['panas_daily', 'end_of_day_log'];

    const sequence = flow.type === 'regular' ? REGULAR_FLOW_SEQUENCE : EOD_FLOW_SEQUENCE;
    const currentStepIndex = sequence.indexOf(flow.step);
    const totalSteps = sequence.length;

    const stepTitles: {[key: string]: string} = {
        sam: "Como você está se sentindo agora?",
        feed_context: "Contexto",
        panas_contextual: "Emoções (Últimos 5 min)",
        panas_daily: "Emoções (Hoje)",
        end_of_day_log: "Relatório de Fim de Dia"
    };

    const renderStepContent = () => {
        switch (flow.step) {
            case 'sam':
                return <SAMComponent onComplete={(sam) => onStep({ sam })} />;
            case 'feed_context':
                return <FeedContextComponent onComplete={(wasWatchingFeed) => onStep({ wasWatchingFeed })} />;
            case 'panas_contextual':
                const panasQuestion = flow.data.wasWatchingFeed
                    ? "Quais emoções você sentiu ao assistir vídeos nos últimos 5 minutos?"
                    : "Quais emoções percebe ter sentido nos últimos 5 minutos?";
                return <PANASComponent question={panasQuestion} onComplete={(panas) => onStep({ panas })} />;
            case 'panas_daily':
                 return <PANASComponent question="Indique até que ponto você se sentiu desta forma hoje." onComplete={(panas) => onStep({ panas })} />;
            case 'end_of_day_log':
                return <EndOfDayLogComponent onComplete={(data) => onStep(data)} />;
            default:
                return <div>Passo desconhecido.</div>;
        }
    };
    
    return (
        <Modal onClose={onCancel} className="max-w-4xl">
             <div className="p-4 sm:p-8">
                <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h2 className="text-xl font-bold text-cyan-400">{stepTitles[flow.step]}</h2>
                        </div>
                        <span className="text-sm font-semibold text-gray-400">
                            Passo {currentStepIndex + 1} <span className="font-normal text-gray-500">de</span> {totalSteps}
                        </span>
                    </div>
                    <div className="w-full bg-gray-700/50 rounded-full h-1">
                        <div 
                            className="bg-cyan-400 h-1 rounded-full transition-all duration-300" 
                            style={{width: `${((currentStepIndex + 1) / totalSteps) * 100}%`}}>
                        </div>
                    </div>
                </div>
                {renderStepContent()}
            </div>
        </Modal>
    );
};

const SAMDynamicFigure: React.FC<{ type: 'pleasure' | 'arousal' | 'dominance', value: number }> = ({ type, value }) => {
   // ... (Keeping SAMDynamicFigure implementation)
   const bodyPath = "M20,80 C10,70 10,30 50,20 C90,30 90,70 80,80 Z";
    const normalizedValue = (value - 1) / 8;
    let content;
    if (type === 'pleasure') {
        const mouthY = 68;
        const mouthControlY = mouthY + 15 * (0.5 - normalizedValue) * 2;
        const mouthPath = `M 35,${mouthY} Q 50,${mouthControlY} 65,${mouthY}`;
        const cheekOpacity = Math.max(0, (normalizedValue - 0.6) / 0.4);
        content = <>
            <path d={bodyPath} />
            <path d={mouthPath} strokeWidth="3" fill="none" />
            <circle cx="40" cy="50" r="5" fill="currentColor" />
            <circle cx="60" cy="50" r="5" fill="currentColor" />
            {cheekOpacity > 0 && <>
                <ellipse cx="30" cy="60" rx="5" ry="3" fill="currentColor" opacity={cheekOpacity} className="text-cyan-200/50" />
                <ellipse cx="70" cy="60" rx="5" ry="3" fill="currentColor" opacity={cheekOpacity} className="text-cyan-200/50" />
            </>}
        </>;
    } else if (type === 'arousal') {
        const eyeRadius = 1.5 + normalizedValue * 5.5;
        const mouthPath = "M 35,70 Q 50,72 65,70";
        content = <>
            <path d={bodyPath} />
            <path d={mouthPath} strokeWidth="3" fill="none" />
            { value < 3 ? ( <> <path d="M 35 50 H 45" strokeWidth="3" /> <path d="M 55 50 H 65" strokeWidth="3" /> </> ) : ( <> <circle cx="40" cy="50" r={eyeRadius} fill="currentColor" /> <circle cx="60" cy="50" r={eyeRadius} fill="currentColor" /> </> )}
            {value > 7 && <path d="M5,40 L15,50 L5,60" strokeWidth="2" opacity={0.3 + (normalizedValue - 0.75)*2} transform={`rotate(${(value-7)*5} 10 50)`} />}
            {value > 7 && <path d="M95,40 L85,50 L95,60" strokeWidth="2" opacity={0.3 + (normalizedValue - 0.75)*2} transform={`rotate(${-(value-7)*5} 90 50)`} />}
        </>;
    } else { 
        const scale = 0.6 + normalizedValue * 0.5;
        const x = 50 - (50 * scale);
        const y = 80 - (80 * scale);
        const transform = `translate(${x}, ${y}) scale(${scale})`;
        const eyebrowY1 = 42 + 5 * normalizedValue;
        const eyebrowY2 = 42 - 5 * normalizedValue;
        content = <g transform={transform}>
            <path d={bodyPath} />
            <path d="M 35,70 Q 50,68 65,70" strokeWidth="3" fill="none" />
            <circle cx="40" cy="50" r="5" fill="currentColor" />
            <circle cx="60"cy="50" r="5" fill="currentColor" />
            <path d={`M 32,${eyebrowY1} L 48,${eyebrowY2}`} strokeWidth="3" />
            <path d={`M 68,${eyebrowY1} L 52,${eyebrowY2}`} strokeWidth="3" />
        </g>;
    }
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full transition-all duration-300 ease-in-out">
        <g fill="rgba(0, 255, 255, 0.1)" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-300">
            {content}
        </g>
      </svg>
    );
};

const SAMComponent: React.FC<{ onComplete: (data: SamResponse) => void }> = ({ onComplete }) => {
    // ... (Keeping SAMComponent)
    const [responses, setResponses] = useState<SamResponse>({ pleasure: 0, arousal: 0, dominance: 0 });
    const [currentStep, setCurrentStep] = useState<'pleasure' | 'arousal' | 'dominance'>('pleasure');

    const handleNext = () => {
        if (currentStep === 'pleasure') setCurrentStep('arousal');
        else if (currentStep === 'arousal') setCurrentStep('dominance');
        else if (currentStep === 'dominance') onComplete(responses);
    };

    const handleBack = () => {
        if (currentStep === 'arousal') setCurrentStep('pleasure');
        else if (currentStep === 'dominance') setCurrentStep('arousal');
    };

    const SAMSlider: React.FC<{label: string, type: 'pleasure' | 'arousal' | 'dominance', description: string}> = ({label, type, description}) => {
        const values = Array.from({length: 9}).map((_, i) => i + 1);
        return (
            <div className="flex flex-col space-y-4 animate-fade-in">
                 <p className="text-sm text-gray-400 text-center italic">{description}</p>
                <div className="grid grid-cols-[auto,1fr] gap-2 sm:gap-4 items-center">
                    <div>
                        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-slate-800 rounded-full p-2 border-2 border-cyan-400/30">
                        {responses[type] > 0 && <SAMDynamicFigure type={type} value={responses[type]} />}
                        </div>
                    </div>
                    <div>
                        <h3 className="text-base sm:text-xl font-semibold text-cyan-300 mb-2">{label}</h3>
                        <div className="flex justify-between items-center bg-slate-900/70 p-1 sm:p-2 rounded-full space-x-0.5 sm:space-x-1">
                            {values.map((val) => (
                            <button 
                                    key={val}
                                    onClick={() => setResponses(p => ({...p, [type]: val}))}
                                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center transition-all duration-150 transform hover:scale-110 text-xs
                                        ${responses[type] === val 
                                            ? 'bg-cyan-400 border-cyan-300 text-brand-dark font-bold shadow-glow-blue-sm' 
                                            : 'border-gray-600 hover:border-cyan-500 text-gray-400'}`}
                                >
                                {val}
                            </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    const descriptions = {
        pleasure: "O nível 1 representa total tristeza/desprazer, e o nível 9 representa total alegria/prazer.",
        arousal: "O nível 1 representa muito calmo/sonolento, e o nível 9 representa muito estimulado/alerta.",
        dominance: "O nível 1 representa sentir-se controlado/submisso, e o nível 9 representa sentir-se no controle/dominante."
    };
    return (
        <div className="space-y-4 sm:space-y-6 py-4">
            {currentStep === 'pleasure' && <SAMSlider label="Prazer / Valência" type="pleasure" description={descriptions.pleasure} />}
            {currentStep === 'arousal' && <SAMSlider label="Excitação / Ativação" type="arousal" description={descriptions.arousal} />}
            {currentStep === 'dominance' && <SAMSlider label="Dominância" type="dominance" description={descriptions.dominance} />}

            <div className="flex justify-between pt-4">
                 {currentStep !== 'pleasure' ? (
                     <button onClick={handleBack} className="px-6 py-2 font-bold text-cyan-300 bg-transparent border border-cyan-400/50 rounded-lg hover:bg-cyan-400/10 transition-colors">Voltar</button>
                 ) : <div />}
                 <button 
                    onClick={handleNext} 
                    disabled={responses[currentStep] === 0} 
                    className="px-8 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors shadow-glow-blue disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {currentStep === 'dominance' ? 'Próximo' : 'Continuar'}
                </button>
            </div>
        </div>
    );
};


const FeedContextComponent: React.FC<{ onComplete: (wasWatching: boolean) => void }> = ({ onComplete }) => {
    return (
        <div className="py-8 text-center min-h-[200px] flex flex-col justify-center">
            <h2 className="text-2xl font-bold text-cyan-400 mb-8">E aí? Você estava "rolando o feed"?</h2>
            <div className="flex justify-center space-x-6">
                 <button onClick={() => onComplete(false)} className="px-12 py-3 font-bold text-white bg-red-600/80 rounded-lg hover:bg-red-500/80 transition-all transform hover:scale-105">Não</button>
                 <button onClick={() => onComplete(true)} className="px-12 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-all shadow-glow-blue transform hover:scale-105">Sim</button>
            </div>
        </div>
    );
};

// --- UPDATED PANAS COMPONENT (PAGINATED & DEFAULT VALUE 1) ---
const PANASComponent: React.FC<{ question: string, onComplete: (data: PanasResponse) => void }> = ({ question, onComplete }) => {
    const adjectives = [
        "Interessado(a)", "Perturbado(a)", "Animado(a)", "Chateado(a)", "Forte",
        "Culpado(a)", "Assustado(a)", "Hostil", "Entusiasmado(a)", "Orgulhoso(a)",
        "Irritado(a)", "Alerta", "Envergonhado(a)", "Inspirado(a)", "Nervoso(a)",
        "Determinado(a)", "Atento(a)", "Agitado(a)", "Ativo(a)", "Com medo"
    ];

    const ITEMS_PER_PAGE = 4;
    const [page, setPage] = useState(0);

    // Inicializa todos os adjetivos com valor 1 (default)
    const [ratings, setRatings] = useState<PanasResponse>(() => {
        const initial: PanasResponse = {};
        adjectives.forEach(adj => { initial[adj] = 1; });
        return initial;
    });

    const totalPages = Math.ceil(adjectives.length / ITEMS_PER_PAGE);
    const startIndex = page * ITEMS_PER_PAGE;
    const currentAdjectives = adjectives.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleChange = (adjective: string, value: number) => {
        setRatings(prev => ({ ...prev, [adjective]: value }));
    };

    const handleNext = () => {
        if (page < totalPages - 1) {
            setPage(prev => prev + 1);
        } else {
            onComplete(ratings);
        }
    };

    const handleBack = () => {
        if (page > 0) {
            setPage(prev => prev - 1);
        }
    };

    return (
        <div className="space-y-6 py-4 animate-fade-in w-full">
             <h3 className="text-lg text-center text-gray-300 mb-6 font-light leading-relaxed">{question}</h3>
             
             <div className="grid grid-cols-1 gap-4 min-h-[300px]">
                {currentAdjectives.map(adj => (
                    <div key={adj} className="bg-slate-800/50 p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 border border-cyan-400/10 animate-fade-in transition-all hover:bg-slate-800/80">
                        <span className="text-cyan-300 font-medium text-lg min-w-[120px] text-center sm:text-left">{adj}</span>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
                             <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider w-12 text-right">Pouco</span>
                             <div className="flex space-x-2">
                                 {[1, 2, 3, 4, 5].map(val => (
                                     <button
                                        key={val}
                                        onClick={() => handleChange(adj, val)}
                                        className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 ${ratings[adj] === val ? 'bg-cyan-400 border-cyan-400 text-brand-dark font-bold shadow-glow-blue scale-110' : 'bg-transparent border-gray-700 text-gray-500 hover:border-cyan-400/50 hover:text-cyan-300'}`}
                                     >
                                         {val}
                                     </button>
                                 ))}
                             </div>
                             <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider w-12 text-left">Muito</span>
                        </div>
                    </div>
                ))}
             </div>

             {/* Progress Dots */}
             <div className="flex justify-center space-x-1.5 mt-4">
                 {Array.from({length: totalPages}).map((_, i) => (
                     <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === page ? 'w-8 bg-cyan-400 shadow-glow-blue-sm' : 'w-2 bg-gray-700'}`} />
                 ))}
             </div>

             <div className="flex justify-between pt-4">
                <button 
                    onClick={handleBack}
                    disabled={page === 0}
                    className={`px-6 py-2 font-bold text-cyan-300 bg-transparent border border-cyan-400/50 rounded-lg hover:bg-cyan-400/10 transition-colors ${page === 0 ? 'invisible' : ''}`}
                >
                    Voltar
                </button>
                <button 
                    onClick={handleNext}
                    className="px-8 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors shadow-glow-blue hover:scale-105 active:scale-95"
                >
                    {page === totalPages - 1 ? 'Concluir' : 'Próximo'}
                </button>
             </div>
        </div>
    );
};

const EndOfDayLogComponent: React.FC<{ onComplete: (data: Partial<InstrumentResponse>) => void }> = ({ onComplete }) => {
    // ... (Keeping EndOfDayLogComponent)
    const [sleepQuality, setSleepQuality] = useState<number>(0);
    const [stressfulEvents, setStressfulEvents] = useState("");
    const [screenTimeLog, setScreenTimeLog] = useState<ScreenTimeEntry[]>([]);
    const [newEntry, setNewEntry] = useState<Partial<ScreenTimeEntry>>({ platform: 'TikTok', duration: '', otherPlatformDetail: '' });

    const addEntry = () => {
        if (newEntry.platform && newEntry.duration) {
            setScreenTimeLog([...screenTimeLog, { 
                id: Date.now().toString(), 
                platform: newEntry.platform!, 
                otherPlatformDetail: newEntry.otherPlatformDetail || '', 
                duration: newEntry.duration 
            }]);
            setNewEntry({ platform: 'TikTok', duration: '', otherPlatformDetail: '' });
        }
    };

    const removeEntry = (id: string) => {
        setScreenTimeLog(screenTimeLog.filter(e => e.id !== id));
    };

    return (
        <div className="space-y-6 py-4 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
            <div>
                <label className="block text-cyan-300 font-bold mb-2">Como você avalia a qualidade do seu sono na noite passada?</label>
                <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-cyan-400/10">
                    {[1, 2, 3, 4, 5].map(val => (
                         <button
                            key={val}
                            onClick={() => setSleepQuality(val)}
                            className={`flex-1 py-2 mx-1 rounded-md border transition-all ${sleepQuality === val ? 'bg-cyan-400 border-cyan-300 text-brand-dark font-bold shadow-glow-blue-sm' : 'border-gray-600 text-gray-400 hover:border-cyan-500 hover:text-cyan-300'}`}
                         >
                             {val}
                         </button>
                     ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
                    <span>Péssima</span>
                    <span>Excelente</span>
                </div>
            </div>

            <div>
                 <label className="block text-cyan-300 font-bold mb-2">Ocorreu algum evento muito estressante hoje?</label>
                 <textarea 
                    value={stressfulEvents}
                    onChange={(e) => setStressfulEvents(e.target.value)}
                    placeholder="Se sim, descreva brevemente. Se não, deixe em branco."
                    className="w-full bg-slate-800/50 border border-cyan-400/30 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-400 transition-colors min-h-[80px]"
                 />
            </div>

            <div>
                <label className="block text-cyan-300 font-bold mb-2">Registro de Tempo de Tela</label>
                <p className="text-xs text-gray-400 mb-4">Consulte o "Bem-estar Digital" (Android) ou "Tempo de Uso" (iOS) e registre o tempo gasto hoje em apps de vídeo.</p>
                
                <div className="space-y-2 mb-4">
                    {screenTimeLog.map(entry => (
                        <div key={entry.id} className="flex justify-between items-center bg-slate-800/30 p-2 rounded border border-gray-700">
                             <span className="text-gray-300 text-sm">{entry.platform === 'Outros' ? entry.otherPlatformDetail : entry.platform} - {entry.duration}</span>
                             <button onClick={() => removeEntry(entry.id)} className="text-red-400 hover:text-red-300"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                    ))}
                    {screenTimeLog.length === 0 && <p className="text-gray-500 text-sm italic text-center py-2">Nenhum registro adicionado.</p>}
                </div>

                <div className="bg-slate-800/50 p-3 rounded-lg border border-cyan-400/10">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <select 
                            value={newEntry.platform} 
                            onChange={(e) => setNewEntry({...newEntry, platform: e.target.value})}
                            className="bg-slate-800 border border-cyan-400/30 rounded p-2 text-white text-sm focus:outline-none focus:border-cyan-400"
                        >
                            <option value="TikTok">TikTok</option>
                            <option value="Instagram">Instagram</option>
                            <option value="YouTube">YouTube</option>
                            <option value="Outros">Outros</option>
                        </select>
                        <input 
                            type="text" 
                            value={newEntry.duration || ''}
                            onChange={(e) => setNewEntry({...newEntry, duration: e.target.value})}
                            placeholder="Ex: 1h 20m"
                            className="bg-slate-800 border border-cyan-400/30 rounded p-2 text-white text-sm focus:outline-none focus:border-cyan-400"
                        />
                    </div>
                    {newEntry.platform === 'Outros' && (
                        <input 
                            type="text"
                            value={newEntry.otherPlatformDetail || ''}
                            onChange={(e) => setNewEntry({...newEntry, otherPlatformDetail: e.target.value})}
                            placeholder="Qual aplicativo?"
                            className="w-full bg-slate-800 border border-cyan-400/30 rounded p-2 text-white text-sm mb-2 focus:outline-none focus:border-cyan-400"
                        />
                    )}
                    <button 
                        onClick={addEntry}
                        disabled={!newEntry.duration}
                        className="w-full py-2 border border-cyan-400 text-cyan-400 rounded hover:bg-cyan-400/10 transition-colors flex justify-center items-center text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <PlusIcon className="w-4 h-4 mr-2" /> Adicionar
                    </button>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button 
                    onClick={() => onComplete({ sleepQuality, stressfulEvents, screenTimeLog })}
                    disabled={sleepQuality === 0}
                    className="px-8 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors shadow-glow-blue disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Finalizar Dia
                </button>
             </div>
        </div>
    );
};

export default App;