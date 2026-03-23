importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBUiYq7DihDjcK7f5pJLPFFN02K-ZAfuLU",
  messagingSenderId: "305426412",
  projectId: "sanitap-system",
  appId: "1:305426412:web:020c0517b6599ec4fe1ac9"
});

const messaging = firebase.messaging();

// ✅ Background notification handler
messaging.onBackgroundMessage((payload) => {
  console.log("🔥 BACKGROUND RECEIVED:", payload);

  const { title, body } = payload.data; // now payload.data is defined
  self.registration.showNotification(title, { body, icon: "/logo192.png" });
});

// ✅ Debugging
self.addEventListener('install', () => console.log("✅ SW Installed"));
self.addEventListener('activate', () => console.log("✅ SW Activated"));