import './App.css';
import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';

import DashboardHeader from './Dashboard/DashboardHeader';
import StatCard from './Dashboard/StatCard';
import ProductsTable from './Dashboard/ProductsTable';
import List from './pages/List/List';

import { messaging, registerServiceWorker } from "./firebase";
import { getToken, onMessage } from "firebase/messaging";

function App() {

  useEffect(() => {
    const setupFCM = async () => {
      try {
        // 1️⃣ Register SW
        const registration = await registerServiceWorker();

        // 2️⃣ Request Notification permission
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          console.log("❌ Notification permission denied");
          return;
        }

        // 3️⃣ Get FCM token (with SW)
        const token = await getToken(messaging, {
          vapidKey: "BNaoSnZKFRYVQSuH30nDL2SHH5UF_8kWIs3L_bpGJPKVRvI6VvQoqDF5GwgneTGaubtxnZepn-iSdjazfb4GtuE",
          serviceWorkerRegistration: registration
        });

        console.log("✅ FCM Token:", token);

        // 4️⃣ Send token to backend
        await fetch("http://localhost:5001/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token })
        });

        // 5️⃣ Foreground messages
        onMessage(messaging, (payload) => {
          console.log("📩 FOREGROUND RECEIVED:", payload);
          alert(`${payload?.notification?.title}\n${payload?.notification?.body}`);
        });

      } catch (error) {
        console.error("❌ FCM setup error:", error);
      }
    };

    setupFCM();
  }, []);

  // Sample dashboard data
  const stats = [
    { title: 'Total Products', value: '4', date: 'As of 12/23/2025' },
    { title: 'Low Stock Items', value: '3', date: 'As of 12/23/2025' },
    { title: 'Total Sales', value: '₱ 755.00', date: 'As of 12/23/2025' }
  ];

  const products = [
    { name: 'Menstrual Pads', price: '₱ 10.00', sales: '27', revenue: '₱ 10.00', status: 'Low Stock' },
    { name: 'Wet Wipes', price: '₱ 10.00', sales: '14', revenue: '₱ 10.00', status: 'Low Stock' },
    { name: 'Tissue', price: '₱ 10.00', sales: '21', revenue: '₱ 10.00', status: 'Low Stock' },
    { name: 'Soap', price: '₱ 15.00', sales: '09', revenue: '₱ 10.00', status: 'In Stock' }
  ];

  return (
    <div className="app">
      <DashboardHeader />
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <div className="stats-section">
                  {stats.map((stat, index) => (
                    <StatCard key={index} title={stat.title} value={stat.value} date={stat.date} />
                  ))}
                </div>
                <ProductsTable products={products} />
              </>
            }
          />
          <Route path="/list" element={<List />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;