import React from 'react';
import DashboardHeader from '../../components/Dashboard/DashboardHeader';
import StatCard from '../../components/Dashboard/StatCard';
import ProductsTable from '../../components/Dashboard/ProductsTable';
import { productsData } from '../../data/products';
import './Dashboard.css';

export default function Dashboard() {
  const stats = [
    { title: 'Total Products', value: '4', date: 'As of 12/23/2025' },
    { title: 'Low Stock Items', value: '3', date: 'As of 12/23/2025' },
    { title: 'Total Sales', value: '₱ 755.00', date: 'As of 12/23/2025' },
  ];

  return (
    <div className="dashboard">
      <DashboardHeader />
      
      <div className="dashboard-content">
        {/* Stats Section */}
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Products Table Section */}
        <ProductsTable products={productsData} />
      </div>
    </div>
  );
}
