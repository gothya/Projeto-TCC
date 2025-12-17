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
  onComplete: (nickname: string, data: SociodemographicData) => void;
}> = ({ onComplete }) => {
  const [step, setStep] = useState(0); // 0: Consent, 1: Questionnaire, 2: Nickname
  const [nickname, setNickname] = useState("");
  const [sociodemographicData, setSociodemographicData] =
    useState<SociodemographicData | null>(null);

  const handleConsent = (agreed: boolean) => {
    if (agreed) {
      setStep(1);
    } else {
      alert(
        "Para participar da pesquisa, você precisa concordar com os termos."
      );
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
    return (
      <SociodemographicQuestionnaireScreen
        onComplete={handleQuestionnaireComplete}
      />
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
          Iniciar Jornada
        </button>
      </div>
    </div>
  );
};
