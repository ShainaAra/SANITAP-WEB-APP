import React from 'react';
import './ProductsTable.css';

export default function ProductsTable({ products }) {
  const getStatusClass = (status) => {
    return status.toLowerCase().replace(/\s+/g, '-');
  };

  return (
    <div className="products-section">
      <h2 className="section-title">Products</h2>
      
      <div className="table-wrapper">
        <table className="products-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Price</th>
              <th>Sales</th>
              <th>Revenue</th>
              <th>Status</th>
              <th className="action-header">Action</th> {/* Added class */}
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
                <td className="action-cell"> {/* Added class */}
                  <button className="action-button">⋯</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}