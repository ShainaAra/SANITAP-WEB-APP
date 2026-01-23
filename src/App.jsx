import './App.css';
import { Routes, Route } from 'react-router-dom';
import DashboardHeader from './Dashboard/DashboardHeader';
import StatCard from './Dashboard/StatCard';
import ProductsTable from './Dashboard/ProductsTable';
import List from './pages/List/List';

function App() {
  // Sample data based on your screenshot
  const stats = [
    {
      title: 'Total Products',
      value: '4',
      date: 'As of 12/23/2025'
    },
    {
      title: 'Low Stock Items',
      value: '3',
      date: 'As of 12/23/2025'
    },
    {
      title: 'Total Sales',
      value: '₱ 755.00',
      date: 'As of 12/23/2025'
    }
  ];

  const products = [
    {
      name: 'Menstrual Pads',
      price: '₱ 10.00',
      sales: '27',
      revenue: '₱ 10.00',
      status: 'Low Stock'
    },
    {
      name: 'Wet Wipes',
      price: '₱ 10.00',
      sales: '14',
      revenue: '₱ 10.00',
      status: 'Low Stock'
    },
    {
      name: 'Tissue',
      price: '₱ 10.00',
      sales: '21',
      revenue: '₱ 10.00',
      status: 'Low Stock'
    },
    {
      name: 'Soap',
      price: '₱ 15.00',
      sales: '09',
      revenue: '₱ 10.00',
      status: 'In Stock'
    }
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