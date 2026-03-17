import { SociodemographicData } from "@/src/components/screen/SociodemographicQuestionnaireScreen";

export type OnboardingDraft = {
  uid: string;
  outerStep: 1 | 2;
  questionnaireStep: number;
  questionnaireData: SociodemographicData | null;
  nickname: string;
  savedAt: string;
};

const DRAFT_KEY = (uid: string) => `psylogos_onboarding_draft_${uid}`;
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

function loadDraft(uid: string): OnboardingDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY(uid));
    if (!raw) return null;

    const draft: OnboardingDraft = JSON.parse(raw);

    const isExpired = Date.now() - new Date(draft.savedAt).getTime() > EXPIRY_MS;
    if (isExpired) {
      localStorage.removeItem(DRAFT_KEY(uid));
      return null;
    }

    return draft;
  } catch {
    return null;
  }
}

function saveDraft(uid: string, patch: Omit<OnboardingDraft, "uid" | "savedAt">): void {
  try {
    const draft: OnboardingDraft = {
      ...patch,
      uid,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY(uid), JSON.stringify(draft));
  } catch {
    // localStorage indisponível — sem crash silencioso
  }
}

function clearDraft(uid: string): void {
  try {
    localStorage.removeItem(DRAFT_KEY(uid));
  } catch {
    // sem crash silencioso
  }
}

export function useOnboardingDraft() {
  return { loadDraft, saveDraft, clearDraft };
}
