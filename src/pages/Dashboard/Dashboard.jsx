import React, { useState, useEffect } from 'react';
import DashboardHeader from '../../Dashboard/DashboardHeader';
import StatCard from '../../Dashboard/StatCard';
import ProductsTable from '../../Dashboard/ProductsTable';
import './Dashboard.css';

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { title: 'Total Products', value: products.length.toString(), date: 'As of 01/23/2026' },
    { title: 'Low Stock Items', value: products.filter(p => p.status === 'Low Stock').length.toString(), date: 'As of 01/23/2026' },
    { title: 'Total Sales', value: '₱ ' + products.reduce((sum, p) => sum + parseFloat(p.revenue.replace('₱ ', '')), 0).toFixed(2), date: 'As of 01/23/2026' },
  ];

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

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
        <ProductsTable products={products} />
      </div>
    </div>
  );
}
