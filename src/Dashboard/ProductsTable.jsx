import React from 'react';
import './ProductsTable.css';
import ActionMenu from './ActionMenu';

export default function ProductsTable({ products = [], onDelete, onEdit }) {
  const getStatusClass = (status = '') => {
    return status.toLowerCase().replace(/\s+/g, '-');
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
            {products.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  No products available
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>₱ {Number(product.price).toFixed(2)}</td>
                  <td>{product.sales}</td>
                  <td>₱ {Number(product.revenue).toFixed(2)}</td>
                  <td>
                    <span
                      className={`status-badge ${getStatusClass(product.status)}`}
                    >
                      {product.status}
                    </span>
                  </td>
                  <td className="action-cell">
                    <ActionMenu
                      productId={product.id}
                      product={product}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
