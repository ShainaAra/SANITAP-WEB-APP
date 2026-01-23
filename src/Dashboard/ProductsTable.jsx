import React from 'react';
import './ProductsTable.css';
import ActionMenu from './ActionMenu';

export default function ProductsTable({ products }) {
  const getStatusClass = (status) => {
    return status.toLowerCase().replace(/\s+/g, '-');
  };

  const handleEditProduct = (productId) => {
    console.log('Edit product:', productId);
    // Add your edit logic here
  };

  const handleDeleteProduct = (productId) => {
    console.log('Delete product:', productId);
    // Add your delete logic here
  };

  return (
    <div className="products-section">
      <h2 className="section-title">Hygiene Products</h2>
      
      <div className="table-wrapper">
        <table className="products-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Price</th>
              <th>Sales</th>
              <th>Revenue</th>
              <th>Status</th>
              <th className="action-header">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr key={index}>
                <td>{product.name}</td>
                <td>{product.price}</td>
                <td>{product.sales}</td>
                <td>{product.revenue}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(product.status)}`}>
                    {product.status}
                  </span>
                </td>
                <td>
                  <ActionMenu 
                    productId={index}
                    onEdit={handleEditProduct}
                    onDelete={handleDeleteProduct}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}