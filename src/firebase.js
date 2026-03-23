import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

// ✅ Register service worker
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('✅ Service Worker registered:', registration);

      // Wait until the service worker is active
      if (registration.waiting) {
        await registration.waiting;
      } else if (registration.installing) {
        await new Promise((resolve) => {
          registration.installing.addEventListener('statechange', (event) => {
            if (event.target.state === 'activated') resolve();
          });
        });
      } else if (registration.active) {
        // Already active
      }

      console.log("✅ Service Worker active and ready");
      return registration;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
    }
  }
};

const firebaseConfig = {
  apiKey: "AIzaSyBUiYq7DihDjcK7f5pJLPFFN02K-ZAfuLU",
  authDomain: "sanitap-system.firebaseapp.com",
  projectId: "sanitap-system",
  messagingSenderId: "305426412",
  appId: "1:305426412:web:020c0517b6599ec4fe1ac9"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);