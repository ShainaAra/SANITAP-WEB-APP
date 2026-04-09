import "./App.css";
import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import DashboardHeader from "./Dashboard/DashboardHeader";
import Dashboard from "./pages/Dashboard/Dashboard";
import List from "./pages/List/List";
import Login from "./pages/Login/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import NotificationModal from "./components/NotificationModal";

import { messaging, registerServiceWorker } from "./firebase";
import { getToken as getFcmToken, onMessage } from "firebase/messaging";

function AppLayout({ notification, setNotification }) {
  return (
    <div className="app">
      <DashboardHeader />

      <main className="main-content">
        <Outlet />
      </main>

      <NotificationModal
        data={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}

function App() {
  const [notification, setNotification] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    let unsubscribeOnMessage = null;

    const setupFCM = async () => {
      try {
        const registration = await registerServiceWorker();

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const fcmToken = await getFcmToken(messaging, {
          vapidKey:
            "BNaoSnZKFRYVQSuH30nDL2SHH5UF_8kWIs3L_bpGJPKVRvI6VvQoqDF5GwgneTGaubtxnZepn-iSdjazfb4GtuE",
          serviceWorkerRegistration: registration,
        });

        if (!fcmToken) return;

        await fetch("http://localhost:5001/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: fcmToken }),
        });

        unsubscribeOnMessage = onMessage(messaging, (payload) => {
          const title = payload.data?.title || "Notification";
          const product = payload.data?.product || "";
          const message = payload.data?.message || "";

          if (document.visibilityState === "visible") {
            setNotification({ title, product, message });
          } else if (Notification.permission === "granted") {
            new Notification(title, {
              body: `${product} ${message}`.trim(),
            });
          }
        });
      } catch (error) {
        console.error("❌ FCM setup error:", error);
      }
    };

    setupFCM();

    return () => {
      if (unsubscribeOnMessage) unsubscribeOnMessage();
    };
  }, []);

  return (
    <Routes>
      <Route
        path="/login"
        element={token ? <Navigate to="/" replace /> : <Login />}
      />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout
              notification={notification}
              setNotification={setNotification}
            />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/list" element={<List />} />
      </Route>

      <Route
        path="*"
        element={<Navigate to={token ? "/" : "/login"} replace />}
      />
    </Routes>
  );
}

export default App;