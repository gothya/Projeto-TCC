import React, { useEffect, useRef, useState } from "react";
import { useToast } from "@/src/contexts/ToastContext";
import { ConsentScreen } from "./ConsentScreen";
import { SociodemographicQuestionnaireScreen, SociodemographicData } from "./SociodemographicQuestionnaireScreen";
import { PlexusFace } from "../PlexusFace";
import { OnboardingDraft } from "@/src/hooks/useOnboardingDraft";

export const OnboardingScreen: React.FC<{
  onComplete: (nickname: string, data: SociodemographicData) => void;
  draft: OnboardingDraft | null;
  onDraftChange: (patch: Omit<OnboardingDraft, "uid" | "savedAt">) => void;
  onDraftClear: () => void;
}> = ({ onComplete, draft, onDraftChange, onDraftClear }) => {
  const { showToast } = useToast();
  const [step, setStep] = useState(0); // 0: Consent, 1: Questionnaire, 2: Nickname
  const [nickname, setNickname] = useState("");
  const [sociodemographicData, setSociodemographicData] = useState<SociodemographicData | null>(null);

  // Sub-passo restaurado do questionário (usado apenas na primeira vez que entramos no step 1)
  const [restoredQuestionnaireStep, setRestoredQuestionnaireStep] = useState<number>(0);

  // Debounce do nickname
  const nicknameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleConsent = (agreed: boolean) => {
    if (!agreed) {
      showToast("Para participar da pesquisa, você precisa concordar com os termos.", "info");
      return;
    }

    // Consentimento aceito — verificar se há rascunho para restaurar
    if (draft) {
      if (draft.outerStep === 2) {
        // Participante estava na tela de nickname
        setNickname(draft.nickname || "");
        setSociodemographicData(draft.questionnaireData);
        setStep(2);
      } else {
        // Participante estava no questionário
        setSociodemographicData(draft.questionnaireData);
        setRestoredQuestionnaireStep(draft.questionnaireStep ?? 0);
        setStep(1);
      }
    } else {
      // Sem rascunho — fluxo normal
      onDraftChange({
        outerStep: 1,
        questionnaireStep: 0,
        questionnaireData: null,
        nickname: "",
      });
      setStep(1);
    }
  };

  const handleQuestionnaireComplete = (data: SociodemographicData) => {
    setSociodemographicData(data);
    onDraftChange({
      outerStep: 2,
      questionnaireStep: 4,
      questionnaireData: data,
      nickname: "",
    });
    setStep(2);
  };

  const handleQuestionnaireStepChange = (qStep: number, data: SociodemographicData) => {
    onDraftChange({
      outerStep: 1,
      questionnaireStep: qStep,
      questionnaireData: data,
      nickname: nickname,
    });
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNickname(value);

    if (nicknameDebounceRef.current) clearTimeout(nicknameDebounceRef.current);
    nicknameDebounceRef.current = setTimeout(() => {
      onDraftChange({
        outerStep: 2,
        questionnaireStep: 4,
        questionnaireData: sociodemographicData,
        nickname: value,
      });
    }, 500);
  };

  const handleNicknameSubmit = () => {
    if (nickname.trim().length > 2 && sociodemographicData) {
      onDraftClear();
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
        initialData={sociodemographicData ?? undefined}
        initialStep={restoredQuestionnaireStep}
        onStepChange={handleQuestionnaireStepChange}
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
          onChange={handleNicknameChange}
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
