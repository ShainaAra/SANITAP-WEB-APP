importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBUiYq7DihDjcK7f5pJLPFFN02K-ZAfuLU",
  messagingSenderId: "305426412",
  projectId: "sanitap-system",
  appId: "1:305426412:web:020c0517b6599ec4fe1ac9"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("🔥 BACKGROUND RECEIVED:", payload);

  const title = payload?.data?.title || "Notification";
  const product = payload?.data?.product || "";
  const message = payload?.data?.message || "";
  const url = payload?.data?.url || "http://localhost:5173/";

  const body = `${product} ${message}`.trim();

  self.registration.showNotification(title, {
    body,
    icon: "/logo192.png",
    badge: "/logo192.png",
    requireInteraction: true,
    data: { url }
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "http://localhost:5173/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("localhost:5173") && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      return clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener("install", () => {
  console.log("✅ SW Installed");
});

self.addEventListener("activate", () => {
  console.log("✅ SW Activated");
});