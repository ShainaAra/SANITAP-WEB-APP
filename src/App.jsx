import { useState, useEffect } from 'react';
import './App.css';
import DashboardHeader from './Dashboard/DashboardHeader';
import StatCard from './Dashboard/StatCard';
import ProductsTable from './Dashboard/ProductsTable';

function App() {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState([]);

  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/products');
      const data = await response.json();
      setProducts(data);
      // Calculate stats from data
      const totalProducts = data.length;
      const lowStockItems = data.filter(p => p.status === 'Low Stock').length;
      const totalSales = data.reduce((sum, p) => sum + parseFloat(p.sales), 0);
      setStats([
        {
          title: 'Total Products',
          value: totalProducts.toString(),
          date: `As of ${new Date().toLocaleDateString()}`
        },
        {
          title: 'Low Stock Items',
          value: lowStockItems.toString(),
          date: `As of ${new Date().toLocaleDateString()}`
        },
        {
          title: 'Total Sales',
          value: `₱ ${totalSales.toFixed(2)}`, // Use totalSales here
          date: `As of ${new Date().toLocaleDateString()}`
        },
      ]);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5001/api/products/${id}`, { method: 'DELETE' });
      fetchProducts(); // Refresh data
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  // Handle edit
  const handleEdit = async (id, updatedProduct) => {
    try {
      await fetch(`http://localhost:5001/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      });
      fetchProducts(); // Refresh data
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 0);
    return () => clearTimeout(timer); // Cleanup the timer
  }, []);

  return (
    <div className="app">
      <DashboardHeader />
      
      <main className="main-content">
        {/* Stats Section */}
        <div className="stats-section">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              title={stat.title}
              value={stat.value}
              date={stat.date}
            />
          ))}
        </div>

        {/* Products Section */}
        <ProductsTable products={products} onDelete={handleDelete} onEdit={handleEdit} />
        
        {/* Footer navigation removed */}
      </main>
    </div>
  );
}

export default App;