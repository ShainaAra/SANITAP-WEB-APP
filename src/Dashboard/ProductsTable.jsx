import React, { useState, useEffect } from 'react';
import './ProductsTable.css';

const API_BASE_URL = 'http://localhost:5001/api';

const ProductsTable = () => {
  const [products, setProducts] = useState([]);
  const [showMenu, setShowMenu] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (productId, e) => {
    e.stopPropagation();
    setShowMenu(showMenu === productId ? null : productId);
  };

  const handleEditClick = (product) => {
    console.log('Editing product:', product);
    setEditingProduct({ ...product });
    setShowModal(true);
    setShowMenu(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    // Only allow editing name and price
    if (name === 'name' || name === 'price') {
      setEditingProduct(prev => ({
        ...prev,
        [name]: name === 'price' ? parseFloat(value) || 0 : value
      }));
    }
  };

  const handleSave = async () => {
    try {
      console.log('Saving product:', editingProduct);
      
      const response = await fetch(`${API_BASE_URL}/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingProduct)
      });

      if (!response.ok) throw new Error('Failed to update');

      setProducts(products.map(p => 
        p.id === editingProduct.id ? editingProduct : p
      ));
      
      setShowModal(false);
      setEditingProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product');
    }
  };

  const formatPrice = (price) => {
    return `₱ ${parseFloat(price).toFixed(2)}`;
  };

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <div className="products-table-container">
      <table className="products-table">
        <thead>
          <tr>
            <th>PRODUCT NAME</th>
            <th>PRICE</th>
            <th>SALES</th>
            <th>REVENUE</th>
            <th>STATUS</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{formatPrice(product.price)}</td>
              <td>{product.sales}</td>
              <td>{formatPrice(product.revenue)}</td>
              <td>
                <span className={`status-badge ${product.status?.toLowerCase().replace(' ', '-')}`}>
                  {product.status}
                </span>
              </td>
              <td className="action-cell">
                <button 
                  className="menu-button"
                  onClick={(e) => handleMenuClick(product.id, e)}
                >
                  ⋯
                </button>
                {showMenu === product.id && (
                  <div className="menu-dropdown">
                    <button 
                      className="menu-item"
                      onClick={() => handleEditClick(product)}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Modal */}
      {showModal && editingProduct && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Product Details</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {/* PRODUCT NAME - Editable */}
              <div className="form-group">
                <label>PRODUCT NAME</label>
                <input
                  type="text"
                  name="name"
                  value={editingProduct.name}
                  onChange={handleEditChange}
                  className="form-input"
                  placeholder="Product name"
                />
              </div>

              {/* PRICE - Editable */}
              <div className="form-group">
                <label>PRICE</label>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  value={editingProduct.price}
                  onChange={handleEditChange}
                  placeholder="Enter price"
                  className="form-input"
                />
              </div>

              {/* SALES - Read Only */}
              <div className="form-group">
                <label>SALES</label>
                <div className="read-only-value">{editingProduct.sales}</div>
              </div>

              {/* TOTAL SALES - Read Only */}
              <div className="form-group">
                <label>TOTAL SALES</label>
                <div className="read-only-value">{formatPrice(editingProduct.revenue)}</div>
              </div>

              {/* STATUS - Read Only */}
              <div className="form-group">
                <label>STATUS</label>
                <div className="read-only-value">
                  <span className={`status-badge ${editingProduct.status?.toLowerCase().replace(' ', '-')}`}>
                    {editingProduct.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="save-button" onClick={handleSave}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsTable;