import { useEffect, useMemo, useState } from 'react';

type InstallOutcome = 'accepted' | 'dismissed';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: InstallOutcome }>;
};

function isStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export default function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  const isIos = useMemo(() => /iphone|ipad|ipod/i.test(navigator.userAgent), []);

  useEffect(() => {
    setIsStandalone(isStandaloneMode());

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  if (isStandalone) {
    return null;
  }

  if (deferredPrompt) {
    return (
      <div className="pwa-install-banner" role="status" aria-live="polite">
        <span>Installer StockPerta sur cet appareil</span>
        <button
          type="button"
          className="btn btn-success btn-sm"
          onClick={async () => {
            await deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            if (choice.outcome === 'accepted') {
              setDeferredPrompt(null);
            }
          }}
        >
          Installer
        </button>
      </div>
    );
  }

  if (isIos) {
    return (
      <div className="pwa-install-banner pwa-install-banner-ios" role="note" aria-live="polite">
        <span>Sur iPhone : Partager → “Sur l’écran d’accueil”</span>
      </div>
    );
  }

  return null;
}
