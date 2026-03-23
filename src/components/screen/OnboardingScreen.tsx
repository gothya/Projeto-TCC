import React, { useRef, useState } from "react";
import { useToast } from "@/src/contexts/ToastContext";
import { ConsentScreen } from "./ConsentScreen";
import { SociodemographicQuestionnaireScreen, SociodemographicData } from "./SociodemographicQuestionnaireScreen";
import { PlexusFace } from "../PlexusFace";
import { OnboardingDraft } from "@/src/hooks/useOnboardingDraft";
import userService from "@/src/service/user/UserService";

type NicknameStatus = "idle" | "checking" | "available" | "taken" | "error";

export const OnboardingScreen: React.FC<{
  onComplete: (nickname: string, data: SociodemographicData) => void;
  draft: OnboardingDraft | null;
  onDraftChange: (patch: Omit<OnboardingDraft, "uid" | "savedAt">) => void;
  onDraftClear: () => void;
}> = ({ onComplete, draft, onDraftChange, onDraftClear }) => {
  const { showToast } = useToast();
  const [step, setStep] = useState(0); // 0: Consent, 1: Questionnaire, 2: Nickname
  const [nickname, setNickname] = useState("");
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>("idle");
  const [sociodemographicData, setSociodemographicData] = useState<SociodemographicData | null>(null);

  // Sub-passo restaurado do questionário (usado apenas na primeira vez que entramos no step 1)
  const [restoredQuestionnaireStep, setRestoredQuestionnaireStep] = useState<number>(0);

  // Debounce para salvar rascunho
  const nicknameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Debounce separado para verificação de unicidade
  const nicknameCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setNicknameStatus("idle");

    // Debounce do rascunho (500ms)
    if (nicknameDebounceRef.current) clearTimeout(nicknameDebounceRef.current);
    nicknameDebounceRef.current = setTimeout(() => {
      onDraftChange({
        outerStep: 2,
        questionnaireStep: 4,
        questionnaireData: sociodemographicData,
        nickname: value,
      });
    }, 500);

    // Debounce da verificação de unicidade (600ms)
    if (nicknameCheckRef.current) clearTimeout(nicknameCheckRef.current);
    if (value.trim().length <= 2) return;

    setNicknameStatus("checking");
    nicknameCheckRef.current = setTimeout(async () => {
      try {
        const taken = await Promise.race([
          userService.isNicknameTaken(value),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 5000)
          ),
        ]);
        setNicknameStatus(taken ? "taken" : "available");
      } catch {
        setNicknameStatus("error");
      }
    }, 600);
  };

  const handleNicknameSubmit = async () => {
    if (nickname.trim().length <= 2 || !sociodemographicData) return;
    setNicknameStatus("checking");
    try {
      const taken = await Promise.race([
        userService.isNicknameTaken(nickname),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 5000)
        ),
      ]);
      if (taken) { setNicknameStatus("taken"); return; }
      onDraftClear();
      onComplete(nickname, sociodemographicData);
    } catch {
      setNicknameStatus("error");
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

        <div className="space-y-1.5">
          <input
            type="text"
            value={nickname}
            onChange={handleNicknameChange}
            placeholder="Digite seu nickname"
            className="w-full px-4 py-2 text-center text-white bg-transparent border-b-2 border-cyan-400 focus:outline-none focus:border-cyan-300 focus:shadow-glow-blue-sm transition-all"
          />
          {/* Feedback de unicidade */}
          {nicknameStatus === "checking" && (
            <p className="text-xs text-gray-400 text-center">Verificando disponibilidade…</p>
          )}
          {nicknameStatus === "available" && (
            <p className="text-xs text-green-400 text-center">✅ Disponível!</p>
          )}
          {nicknameStatus === "taken" && (
            <p className="text-xs text-red-400 text-center">❌ Este apelido já está em uso.</p>
          )}
          {nicknameStatus === "error" && (
            <p className="text-xs text-yellow-400 text-center">⚠️ Não foi possível verificar — tente novamente.</p>
          )}
        </div>

        <button
          onClick={handleNicknameSubmit}
          disabled={nicknameStatus !== "available"}
          className="w-full px-6 py-3 font-bold text-brand-dark bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-all duration-300 shadow-glow-blue disabled:bg-gray-600 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {nicknameStatus === "checking" ? "Verificando…" : "Iniciar Jornada"}
        </button>
      </div>
    </div>
  );
};
