type DeferredPromptEvent = {
  prompt(): void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let _prompt: DeferredPromptEvent | null = null;

export function initInstallPromptCapture(): void {
  if (_prompt !== null) return; // guard de idempotência
  window.addEventListener(
    'beforeinstallprompt',
    (e) => {
      e.preventDefault();
      _prompt = e as unknown as DeferredPromptEvent;
    },
    { once: true }
  );
}

export function getInstallPrompt(): DeferredPromptEvent | null {
  return _prompt;
}

export function clearInstallPrompt(): void {
  _prompt = null;
}
