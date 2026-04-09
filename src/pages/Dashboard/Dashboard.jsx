import React, { useEffect, useState } from "react";
import StatCard from "../../Dashboard/StatCard";
import ProductsTable from "../../Dashboard/ProductsTable";
import { authFetch } from "../../utils/authFetch";
import "./Dashboard.css";

const API_BASE_URL = "http://localhost:5001/api";

export default function Dashboard() {
  const [stats, setStats] = useState([
    { title: "Total Products", value: "0", date: "" },
    { title: "Low Stock Items", value: "0", date: "" },
    { title: "Total Sales", value: "₱ 0.00", date: "" },
  ]);

  const fetchStats = async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/dashboard-stats`);
      const data = await res.json();

      const totalProducts = Number(data?.totalProducts || 0);
      const lowStock = Number(data?.lowStock || 0);
      const totalSales = Number(data?.totalSales || 0);
      const today = new Date().toLocaleDateString();

      setStats([
        {
          title: "Total Products",
          value: totalProducts,
          date: `As of ${today}`,
        },
        {
          title: "Low Stock Items",
          value: lowStock,
          date: `As of ${today}`,
        },
        {
          title: "Total Sales",
          value: `₱ ${totalSales.toFixed(2)}`,
          date: `As of ${today}`,
        },
      ]);
    } catch (error) {
      console.error("❌ Failed to load stats:", error);

      const today = new Date().toLocaleDateString();
      setStats([
        {
          title: "Total Products",
          value: "0",
          date: `As of ${today}`,
        },
        {
          title: "Low Stock Items",
          value: "0",
          date: `As of ${today}`,
        },
        {
          title: "Total Sales",
          value: "₱ 0.00",
          date: `As of ${today}`,
        },
      ]);
    }
  };

  useEffect(() => {
    fetchStats();

    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="dashboard-content">
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <ProductsTable />
    </div>
  );
}