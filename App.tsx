
import React, { useState, useEffect, useId, useRef } from 'react';

// Since this is a single file generation, we will simulate imports.
// In a real project, these would be in separate files.

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

type GameState = {
  user: User;
  badges: Badge[];
  hasOnboarded: boolean;
  studyStartDate: string | null;
  responses: any[]; // Simplified for this example
  pings: PingStatus[][];
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
};


// --- END: Mock Data & Types ---


// --- START: Main App Component ---

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const savedState = localStorage.getItem('gameState');
    // A simple migration for the pings structure if old data exists
    if (savedState) {
        const parsed = JSON.parse(savedState);
        if (!Array.isArray(parsed.pings[0])) {
            parsed.pings = Array(7).fill(0).map(() => Array(7).fill('pending'));
        }
        if (parsed.user && !('avatar' in parsed.user)) {
          parsed.user.avatar = null;
        }
        return parsed;
    }
    return INITIAL_GAME_STATE;
  });

  useEffect(() => {
    localStorage.setItem('gameState', JSON.stringify(gameState));
  }, [gameState]);

  const completeOnboarding = (nickname: string) => {
    setGameState(prev => ({
      ...prev,
      hasOnboarded: true,
      studyStartDate: new Date().toISOString(),
      user: {
        ...prev.user,
        nickname,
      }
    }));
  };

  return (
    <div className="min-h-screen bg-brand-dark bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,128,128,0.3),rgba(255,255,255,0))]">
      {!gameState.hasOnboarded ? (
        <OnboardingScreen onComplete={completeOnboarding} />
      ) : (
        <DashboardScreen gameState={gameState} setGameState={setGameState} />
      )}
    </div>
  );
};

// --- END: Main App Component ---


// --- START: OnboardingScreen Component ---

const OnboardingScreen: React.FC<{ onComplete: (nickname: string) => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState('');

  const handleConsent = (agreed: boolean) => {
    if (agreed) {
      setStep(1);
    } else {
      // This path is less likely to be taken with the new UI, but kept for logic safety
      alert("Para participar da pesquisa, você precisa concordar com os termos.");
    }
  };

  const handleNicknameSubmit = () => {
    if (nickname.trim().length > 2) {
      onComplete(nickname);
    }
  };

  if (step === 0) {
    return <ConsentScreen onConsent={handleConsent} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
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
  
  const rcleText = `Você está sendo convidado(a) a participar como voluntário(a) do estudo Associação longitudinal entre exposição a vídeos curtos e variabilidade emocional: moderação da valência e efeitos no humor diário, DESENVOLVIDO POR PESQUISADORES DO Centro de Ensino Unificado de Brasília (UniCEUB). O nome deste documento que você está lendo é Registro de Consentimento Livre e Esclarecido (RCLE) que visa assegurar seus direitos como participante.
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
O CEP é um grupo de profissionais de várias áreas do conhecimento e da comunidade, autônomo, de relevância pública, que tem o propósito de defender os interesses dos participantes da pesquisa em sua integridade e dignidade e de contribuir para o desenvolvimento da pesquisa dentro de padrões éticos.
Caso concorde em participar deste estudo, favor assinalar a opção a seguir: ( ) Concordo em participar do estudo aqui apresentado.`;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
       <div className="w-full max-w-2xl p-8 space-y-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-cyan-400/20 shadow-glow-blue">
         <h1 className="text-2xl font-bold text-cyan-400 text-center">Bem vindo ao ENIGMA DE PSYLOGOS!</h1>
         <h2 className="text-xl font-semibold text-white text-center">Registro de Consentimento Livre e Esclarecido</h2>
         <div className="h-64 overflow-y-auto p-4 border border-cyan-400/30 rounded-lg bg-black/20 text-gray-300 text-sm">
            <p className="whitespace-pre-wrap">{rcleText}</p>
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
                onClick={() => onConsent(true)}
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


// --- END: OnboardingScreen Component ---

// --- START: DashboardScreen Component ---

const DashboardScreen: React.FC<{ gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>> }> = ({ gameState, setGameState }) => {
  const { user, pings } = gameState;
  const [highlightedPing, setHighlightedPing] = useState<{ day: number, ping: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handlePingResponse = (confirmed: boolean) => {
    if (!highlightedPing) return;

    const { day, ping } = highlightedPing;
    const newPings = pings.map(row => [...row]);
    
    newPings[day][ping] = confirmed ? 'completed' : 'missed';

    const newXp = newPings.flat().reduce((acc, status, index) => {
      if (status === 'completed') {
        const isStar = (index + 1) % 7 === 0;
        return acc + (isStar ? 100 : 50);
      }
      return acc;
    }, 0);

    const newLevel = calculateLevel(newXp);

    setGameState(prev => ({
        ...prev,
        pings: newPings,
        user: {
          ...prev.user,
          points: newXp,
          level: newLevel,
        }
    }));

    setIsModalOpen(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setGameState(prev => ({
          ...prev,
          user: {
            ...prev.user,
            avatar: reader.result as string,
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };


  const notificationTimes = ['9h', '11h', '13h', '15h', '17h', '19h', '21h'];
  
  const completedPings = pings.flat().filter((p, index) => (index + 1) % 7 !== 0 && p === 'completed').length;
  const missedPings = pings.flat().filter((p, index) => (index + 1) % 7 !== 0 && p === 'missed').length;
  const completedStars = pings.flat().filter((p, index) => (index + 1) % 7 === 0 && p === 'completed').length;
  
  const { level, points: totalXp } = user;
  const currentLevelXpStart = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextLevelXpTarget = LEVEL_THRESHOLDS[level] ?? (LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]);
  
  const xpForThisLevel = nextLevelXpTarget - currentLevelXpStart;
  const xpIntoLevel = totalXp - currentLevelXpStart;
  
  const progressPercentage = (xpForThisLevel > 0 && xpIntoLevel >= 0) ? (xpIntoLevel / xpForThisLevel) * 100 : 0;

  const pingIconClasses = "transition-transform duration-150 ease-in-out";

  const allPlayers = [...MOCK_PLAYERS, { nickname: user.nickname, points: user.points }]
    .sort((a, b) => b.points - a.points);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {isModalOpen && highlightedPing && (
        <PingConfirmationModal 
          onConfirm={() => handlePingResponse(true)}
          onDeny={() => handlePingResponse(false)}
        />
      )}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
           <button
            onClick={handleAvatarClick}
            className="relative group w-16 h-16 rounded-full bg-slate-800 border-2 border-cyan-400 flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:border-cyan-300 hover:shadow-glow-blue-sm"
            aria-label="Alterar avatar"
          >
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar do usuário" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-8 h-8 text-cyan-400" />
            )}
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <CameraIcon className="w-6 h-6 text-white" />
            </div>
          </button>
           <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/png, image/jpeg"
            className="hidden"
          />
          <div>
            <h1 className="text-xl font-bold text-cyan-400">{user.nickname}</h1>
            <p className="text-gray-400">Nível {user.level} - Mente Curiosa</p>
          </div>
        </div>
        <button 
          className="p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setIsModalOpen(true)}
          disabled={!highlightedPing}
          aria-label="Responder próximo ping"
        >
           <BellIcon className="w-6 h-6 text-cyan-400"/>
        </button>
      </header>
      
      <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3">
            <Card>
                <div className="p-2 text-center">
                     <h2 className="text-lg font-semibold text-cyan-400 mb-4">"Psylogos, uma inteligência buscando compreender o coração da Humanidade."</h2>
                     <div className="w-64 h-64 mx-auto">
                        <PlexusFace />
                     </div>
                </div>
            </Card>
        </div>

        <Card className="md:col-span-2">
            <h3 className="card-title">XP / LVL</h3>
            <div className="w-full bg-gray-700 rounded-full h-4">
                <div className="bg-cyan-400 h-4 rounded-full" style={{width: `${progressPercentage}%`}}></div>
            </div>
            <div className="flex justify-between mt-1 text-sm text-cyan-300">
                <span>Nível {level}</span>
                <span>{xpIntoLevel} / {xpForThisLevel} XP</span>
                <span>Nível {level + 1}</span>
            </div>
        </Card>

        <Card className="md:col-span-1">
            <h3 className="card-title">Badges</h3>
            <div className="flex justify-around items-center">
                <EmotionExplorerBadge className="w-16 h-16" unlocked={true}/>
                <EmotionExplorerBadge className="w-16 h-16" />
                <EmotionExplorerBadge className="w-16 h-16" />
            </div>
        </Card>
        
        <div className="md:col-span-3">
          <Card>
             <h3 className="card-title text-center mb-4">Resumo da Semana</h3>
             <div className="flex justify-around items-start text-center">
                <div className="flex flex-col items-center space-y-2">
                    <CheckCircleIcon className="w-10 h-10 text-green-400"/>
                    <h4 className="text-sm font-semibold text-gray-300">Pings Respondidos</h4>
                    <p className="text-2xl font-bold text-green-400">{completedPings}<span className="text-sm font-normal text-gray-500">/42</span></p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                    <XCircleIcon className="w-10 h-10 text-red-500"/>
                    <h4 className="text-sm font-semibold text-gray-300">Pings Perdidos</h4>
                    <p className="text-2xl font-bold text-red-500">{missedPings}<span className="text-sm font-normal text-gray-500">/13</span></p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                    <StarIcon className="w-10 h-10 text-yellow-400"/>
                    <h4 className="text-sm font-semibold text-gray-300">Dias Completos</h4>
                    <p className="text-2xl font-bold text-yellow-400">{completedStars}<span className="text-sm font-normal text-gray-500">/5</span></p>
                </div>
             </div>
          </Card>
        </div>


        <Card className="md:col-span-1">
            <h3 className="card-title">Leaderboard</h3>
            <ul className="space-y-2">
                {allPlayers.slice(0, 7).map((player, index) => {
                    const isCurrentUser = player.nickname === user.nickname;
                    const rank = index + 1;
                    let rankStyle = '';
                    if (rank === 1) rankStyle = 'bg-yellow-500/10 border-yellow-400 text-yellow-300';
                    else if (rank === 2) rankStyle = 'bg-gray-500/10 border-gray-400 text-gray-300';
                    else if (rank === 3) rankStyle = 'bg-orange-500/10 border-orange-400 text-orange-300';

                    const userHighlight = isCurrentUser ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold' : '';

                    return (
                        <li key={player.nickname} className={`flex items-center justify-between p-2 rounded-md border-l-4 transition-all ${userHighlight || rankStyle}`}>
                            <span className="flex items-center">
                                {rank <= 3 && <TrophyIcon rank={rank} className="w-5 h-5 mr-2" />}
                                {rank}. {player.nickname}
                            </span>
                            <span className="font-mono">{player.points}</span>
                        </li>
                    );
                })}
            </ul>
        </Card>

        <Card className="md:col-span-2">
            <h3 className="card-title">Pings (Notificações)</h3>
            <div className="grid grid-cols-7 gap-y-3 items-center text-center">
                {/* Headers */}
                {notificationTimes.map(time => (
                    <div key={time} className="font-semibold text-sm text-cyan-300/80">{time}</div>
                ))}

                {/* Data Grid */}
                {pings.map((day, dayIndex) => (
                  <React.Fragment key={dayIndex}>
                    {day.map((status, pingIndex) => {
                       const isLastColumn = pingIndex === notificationTimes.length - 1;
                       const isHighlighted = highlightedPing?.day === dayIndex && highlightedPing?.ping === pingIndex;
                       
                       return (
                          <div 
                            key={`${dayIndex}-${pingIndex}`} 
                            className={`h-6 flex items-center justify-center relative`}
                          >
                             {isHighlighted && <div className="absolute inset-0 rounded-full bg-cyan-400/50 animate-ping-glow"></div>}
                            <div className="relative z-10">
                                {isLastColumn ? (
                                    status === 'completed' ? <StarIcon className={`w-5 h-5 text-yellow-400 ${pingIconClasses}`} /> :
                                    status === 'missed' ? <div className={`w-3 h-1 bg-gray-500 rounded-full ${pingIconClasses}`}></div> :
                                    <StarIcon className={`w-5 h-5 text-gray-700 ${pingIconClasses}`} />
                                ) : (
                                    status === 'completed' ? <div className={`w-4 h-4 rounded-full bg-green-400 ${pingIconClasses}`}></div> :
                                    status === 'missed' ? <div className={`w-4 h-4 rounded-full bg-red-500 ${pingIconClasses}`}></div> :
                                    <div className={`w-4 h-4 rounded-full bg-gray-700 ${pingIconClasses}`}></div>
                                )}
                            </div>
                          </div>
                       );
                    })}
                  </React.Fragment>
                ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">Progresso de 7 dias. Verde: Respondido, Vermelho: Perdido, Cinza: Pendente.</p>
        </Card>

      </main>
    </div>
  );
};

// --- END: DashboardScreen Component ---


// --- START: Reusable Components & Icons ---

const PingConfirmationModal: React.FC<{ onConfirm: () => void, onDeny: () => void }> = ({ onConfirm, onDeny }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-900 border border-cyan-400/30 rounded-2xl p-8 shadow-glow-blue text-center w-full max-w-sm">
                <h3 className="text-2xl font-bold text-white mb-6">Confirmar ping?</h3>
                <div className="flex justify-center space-x-4">
                    <button 
                        onClick={onDeny}
                        className="px-8 py-3 font-bold text-white bg-red-600/80 rounded-lg hover:bg-red-500/80 transition-all duration-300 w-28"
                    >
                        Não
                    </button>
                    <button 
                        onClick={onConfirm}
                        className="px-8 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-all duration-300 shadow-glow-blue w-28"
                    >
                        Sim
                    </button>
                </div>
            </div>
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
    // Debris points start at index 53
    {x: 220, y: 40}, {x: 235, y: 55}, {x: 225, y: 70}, // 53-55 Right top
    {x: 25, y: 50}, {x: 15, y: 70}, {x: 30, y: 85},    // 56-58 Left top
    {x: 220, y: 190}, {x: 210, y: 210}, {x: 230, y: 205},// 59-61 Right bottom
    {x: 20, y: 200}, {x: 30, y: 220}, {x: 45, y: 215},   // 62-64 Left bottom
    {x: 185, y: 15}, {x: 200, y: 25}, {x: 180, y: 35},   // 65-67 top right debris
    {x: 65, y: 15}, {x: 50, y: 25}, {x: 70, y: 35},      // 68-70 top left debris
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
    // Debris triangles
    [53, 54, 55], [56, 57, 58], [59, 60, 61], [62, 63, 64], [65, 66, 67], [68, 69, 70]
  ];

  return (
    <svg viewBox="0 0 250 270" xmlns="http://www.w3.org/2000/svg" className="opacity-0 animate-fadeIn" style={{ animationFillMode: 'forwards', animationDelay: '0.2s' }}>
       <style>
        {`
          @keyframes fadeIn {
            to { opacity: 1; }
          }
          @keyframes pulse {
            0% { r: 4; opacity: 0.8; }
            50% { r: 8; opacity: 1; }
            100% { r: 4; opacity: 0.8; }
          }
           @keyframes slowFloat {
            0% { transform: translate(0, 0); }
            25% { transform: translate(1px, 2px); }
            50% { transform: translate(-1px, -2px); }
            75% { transform: translate(1px, -1px); }
            100% { transform: translate(0, 0); }
          }
          @keyframes ping-glow {
            0%, 100% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.5); opacity: 0; }
          }
          .pulse-node {
            animation: pulse 3s infinite ease-in-out;
          }
          .debris {
            animation: slowFloat 8s infinite ease-in-out;
          }
          .animate-ping-glow {
              animation: ping-glow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
        `}
      </style>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
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
      <g filter="url(#glow)">
        {/* Triangles */}
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
        {/* Nodes */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1" fill="url(#gradient)" opacity="0.8" />
        ))}
        {/* Eyes with glow and pulse */}
        <circle cx="168" cy="125" r="8" fill="url(#eyeGlow)" className="pulse-node" />
        <circle cx="82" cy="125" r="8" fill="url(#eyeGlow)" className="pulse-node" style={{ animationDelay: '0.5s' }} />
      </g>
    </svg>
  );
};


const UserIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const CameraIcon = ({ className = '' }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
    </svg>
);


const BellIcon = ({ className = '' }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

const EmotionExplorerBadge = ({ className = '', unlocked = false }: { className?: string, unlocked?: boolean }) => {
    const uniqueId = useId();
    const heartGradientId = `heart-gradient-${uniqueId}`;
    const brainGradientId = `brain-gradient-${uniqueId}`;
    const glowFilterId = `badge-glow-${uniqueId}`;

    const mainColor = unlocked ? "#00ffff" : "#555";
    const secondaryColor = unlocked ? "#3a2d7f" : "#444";
    const highlightColor = unlocked ? "#7df9ff" : "#666";
    const handleColor = unlocked ? "#a98764" : "#666";
    
    return (
        <svg className={className} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id={heartGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={secondaryColor} />
                    <stop offset="100%" stopColor={mainColor} />
                </linearGradient>
                <radialGradient id={brainGradientId}>
                    <stop offset="0%" stopColor={unlocked ? "#fff" : "#777"} />
                    <stop offset="100%" stopColor={unlocked ? highlightColor : "#555"} />
                </radialGradient>
                <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation={unlocked ? "3" : "0"} result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <g filter={`url(#${glowFilterId})`} opacity={unlocked ? 1 : 0.5}>
                {/* Ribbon */}
                <path d="M 5 70 C 10 85, 25 90, 40 80 L 60 90 C 75 100, 90 95, 95 80 L 95 70 C 90 75, 75 80, 60 70 L 40 80 C 25 70, 10 75, 5 70 Z" fill={unlocked ? "#4a90e2" : "#3a3a3a"} stroke={unlocked ? "#a4c8f0" : "#555"} strokeWidth="1" />
                
                {/* Heart */}
                <path d="M50 15 C 40 5, 20 10, 20 25 C 20 45, 50 65, 50 65 C 50 65, 80 45, 80 25 C 80 10, 60 5, 50 15 Z" fill={`url(#${heartGradientId})`} stroke={highlightColor} strokeWidth="1.5" />
                {/* Heart Facets */}
                <path d="M50 15 L 50 65 L 20 25" fill="none" stroke={unlocked ? "rgba(220, 240, 255, 0.3)" : "rgba(100, 100, 100, 0.3)"} strokeWidth="1" />
                <path d="M50 15 L 50 65 L 80 25" fill="none" stroke={unlocked ? "rgba(220, 240, 255, 0.3)" : "rgba(100, 100, 100, 0.3)"} strokeWidth="1" />
                <path d="M35 22 L 50 42 L 65 22" fill="none" stroke={unlocked ? "rgba(220, 240, 255, 0.2)" : "rgba(100, 100, 100, 0.2)"} strokeWidth="0.5" />
        
                {/* Magnifying Glass */}
                <g transform="rotate(-30 40 40)">
                    <path d="M22 60 L 15 75 L 20 80 L 27 65 Z" fill={handleColor} stroke={highlightColor} strokeWidth="0.5" />
                    <circle cx="35" cy="40" r="18" fill={unlocked ? "rgba(0, 255, 255, 0.15)" : "rgba(80, 80, 80, 0.3)"} stroke={handleColor} strokeWidth="4" />
                    {/* Brain Icon */}
                    <g transform="translate(25, 32) scale(0.18)">
                        <path d="M68.5,41.7C65.3,38,62.5,33,62.8,28.3c0.3-4.2,3.3-6.9,3.3-6.9c-1.3-3.2-1.3-7.2-1.3-7.2c-2.6,0-5.2,1.3-6.5,2.6 c-1.3,1.3-2.6,3.9-5.2,3.9s-3.9-2.6-5.2-3.9s-3.9-2.6-6.5-2.6s-5.2,1.3-6.5,2.6s-2.6,3.9-5.2,3.9s-3.9-2.6-5.2-3.9 c-1.3-1.3-3.9-2.6-6.5-2.6c0,0,0,3.9-1.3,7.2c0,0,3,2.6,3.3,6.9c0.3,4.6-2.6,9.6-5.8,13.3S10.2,50,13.4,54.8 c3.3,4.8,8.2,7.9,13.8,7.9c4.2,0,9.1-1.6,12.4-5.2c2.6,3.9,7.8,5.2,12.1,5.2c5.6,0,10.4-3.2,13.8-7.9 C69.1,50,65.3,45.3,68.5,41.7z" 
                        fill={`url(#${brainGradientId})`} />
                        {unlocked && <path d="M68.5,41.7C65.3,38,62.5,33,62.8,28.3c0.3-4.2,3.3-6.9,3.3-6.9c-1.3-3.2-1.3-7.2-1.3-7.2c-2.6,0-5.2,1.3-6.5,2.6 c-1.3,1.3-2.6,3.9-5.2,3.9s-3.9-2.6-5.2-3.9s-3.9-2.6-6.5-2.6s-5.2,1.3-6.5,2.6s-2.6,3.9-5.2,3.9s-3.9-2.6-5.2-3.9 c-1.3-1.3-3.9-2.6-6.5-2.6c0,0,0,3.9-1.3,7.2c0,0,3,2.6,3.3,6.9c0.3,4.6-2.6,9.6-5.8,13.3S10.2,50,13.4,54.8 c3.3,4.8,8.2,7.9,13.8,7.9c4.2,0,9.1-1.6,12.4-5.2c2.6,3.9,7.8,5.2,12.1,5.2c5.6,0,10.4-3.2,13.8-7.9 C69.1,50,65.3,45.3,68.5,41.7z"
                        fill="none" stroke={mainColor} strokeWidth="3" />}
                    </g>
                </g>
            </g>
        </svg>
    );
};

const StarIcon = ({ className = '' }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
);

const CheckCircleIcon = ({ className = '' }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

const XCircleIcon = ({ className = '' }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
    </svg>
);

const TrophyIcon = ({ className = '', rank }: { className?: string, rank: number }) => {
  const colors: { [key: number]: string } = {
    1: 'text-yellow-400',
    2: 'text-gray-300',
    3: 'text-orange-400'
  };
  // FIX: Corrected object property access from incorrect function call syntax to bracket notation.
  const colorClass = colors[rank] || 'text-gray-500';

  return (
    <svg className={`${className} ${colorClass}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C8.686 2 6 4.686 6 8c0 2.21 1.79 4 4 4h4c2.21 0 4-1.79 4-4 0-3.314-2.686-6-6-6zm0 14c-2.21 0-4 1.79-4 4h8c0-2.21-1.79-4-4-4zm0-10c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2zM6 20h12v2H6v-2z"/>
    </svg>
  );
};


// --- END: Reusable Components & Icons ---


export default App;
