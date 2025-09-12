// PWA Service Worker Registration
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
}

// PWA Install Prompt
let deferredPrompt;

export function setupInstallPrompt() {
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      deferredPrompt = e;
      // Show install button or notification
      showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      hideInstallButton();
      deferredPrompt = null;
    });
  }
}

function showInstallButton() {
  // You can customize this to show a custom install button
  console.log('PWA can be installed');
  // Example: dispatch a custom event or update UI
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pwa-installable'));
  }
}

function hideInstallButton() {
  // Hide install button after installation
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pwa-installed'));
  }
}

export async function installPWA() {
  if (deferredPrompt) {
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We no longer need the prompt. Clear it up.
    deferredPrompt = null;
  }
}

// Check if app is already installed
export function isAppInstalled() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}
