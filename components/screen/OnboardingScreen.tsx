import React, { useState } from "react";
import { ConsentScreen } from "./ConsentScreen";
import { SociodemographicQuestionnaireScreen } from "./SociodemographicQuestionnaireScreen";
import { PlexusFace } from "../PlexusFace";

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

export const OnboardingScreen: React.FC<{
  onComplete: (nickname: string, data: SociodemographicData, accessCode: string) => void;
}> = ({ onComplete }) => {
  const [step, setStep] = useState(0); // 0: Consent, 1: Nickname, 2: Questionnaire, 3: Access Code
  const [nickname, setNickname] = useState("");
  const [sociodemographicData, setSociodemographicData] = useState<SociodemographicData | null>(null);
  const [accessCode, setAccessCode] = useState("");

  const handleConsent = (agreed: boolean) => {
    if (agreed) {
      setStep(1);
    } else {
      alert(
        "Para participar da pesquisa, você precisa concordar com os termos."
      );
    }
  };

  const handleNicknameSubmit = () => {
    if (nickname.trim().length > 2) {
      setStep(2);
    }
  };

  const handleQuestionnaireComplete = (data: SociodemographicData) => {
    setSociodemographicData(data);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
    setAccessCode(code);
    setStep(3);
  };

  const handleFinalize = () => {
    if (sociodemographicData) {
      onComplete(nickname, sociodemographicData, accessCode);
    }
  };

  if (step === 0) {
    return <ConsentScreen onConsent={handleConsent} />;
  }

  if (step === 2) {
    return (
      <SociodemographicQuestionnaireScreen
        onComplete={handleQuestionnaireComplete}
      />
    );
  }

  if (step === 3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-fade-in">
        <div className="w-full max-w-md p-8 space-y-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-cyan-400/20 shadow-glow-blue pointer-events-auto">
          <h2 className="text-2xl font-bold text-cyan-400">Código de Recuperação</h2>
          <p className="text-gray-300">
            Atenção! Guarde este código de acesso. Ele será necessário caso você precise recuperar sua conta em outro dispositivo ou limpe o cache do seu navegador.
          </p>

          <div className="bg-slate-800 p-4 rounded-xl border border-yellow-500/50 flex flex-col items-center justify-center space-y-2">
            <span className="text-sm text-yellow-500 uppercase font-bold tracking-widest">Seu Código Restrito</span>
            <span className="text-3xl font-mono text-white font-black">{accessCode}</span>
          </div>

          <div className="text-[10px] text-gray-500 bg-slate-800/50 p-3 rounded-lg text-left italic">
            * Dica: Tire um print da tela, anote em um papel ou envie para você mesmo. O estudo é anônimo e este código é a <b>única</b> forma de linkar seus dados antigos.
          </div>

          <button
            onClick={handleFinalize}
            className="w-full px-6 py-3 mt-4 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-all duration-300 shadow-glow-blue"
          >
            Eu guardei este código! (Continuar)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center animate-fade-in">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-cyan-400/20 shadow-glow-blue">
        <h1 className="text-3xl font-bold text-cyan-400">ENIGMA DE PSYLOGOS</h1>
        <div className="w-64 h-64 mx-auto my-4">
          <PlexusFace />
        </div>
        <h2 className="text-2xl font-semibold text-white">
          Crie seu Pseudônimo
        </h2>
        <p className="text-gray-300">
          Escolha um apelido único que será usado no ranking e para sua
          identificação anônima.
        </p>

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
          Próxima Etapa
        </button>
      </div>
    </div>
  );
};
