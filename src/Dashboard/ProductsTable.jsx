import React, { useState, useEffect, useCallback } from "react";
import { authFetch } from "../utils/authFetch";
import "./ProductsTable.css";

const API_BASE_URL = "http://localhost:5001/api";
const REFRESH_INTERVAL = 3000;

const ProductsTable = () => {
  const [products, setProducts] = useState([]);
  const [showMenu, setShowMenu] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const response = await authFetch(`${API_BASE_URL}/products`);

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading products:", error);
      setProducts([]);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchProducts(true);

    const interval = setInterval(() => {
      fetchProducts(false);
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchProducts]);

  const handleMenuClick = (productId, e) => {
    e.stopPropagation();
    setShowMenu(showMenu === productId ? null : productId);
  };

  const handleEditClick = (product) => {
    setEditingProduct({ ...product });
    setShowModal(true);
    setShowMenu(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    if (name === "name" || name === "price") {
      setEditingProduct((prev) => ({
        ...prev,
        [name]: name === "price" ? parseFloat(value) || 0 : value,
      }));
    }
  };

  const handleSave = async () => {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/products/${editingProduct.id}`,
        {
          method: "PUT",
          body: JSON.stringify(editingProduct),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update");
      }

      await fetchProducts(false);

      setShowModal(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Error updating product:", error);
      alert("Failed to update product");
    }
  };

  const formatPrice = (price) => {
    return `₱ ${parseFloat(price || 0).toFixed(2)}`;
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".action-cell")) {
        setShowMenu(null);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [showMenu]);

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <div className="products-table-container">
      <div className="table-wrapper">
        <div className="table-scroll">
          <table className="products-table">
            <thead>
              <tr>
                <th>PRODUCT NAME</th>
                <th>PRICE</th>
                <th>SALES</th>
                <th>REVENUE</th>
                <th>STATUS</th>
                <th className="action-header">ACTION</th>
              </tr>
            </thead>

            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{formatPrice(product.price)}</td>
                    <td>{product.sales}</td>
                    <td>{formatPrice(product.revenue)}</td>
                    <td>
                      <span
                        className={`status-badge ${product.status
                          ?.toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && editingProduct && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Product Details</h2>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
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

              <div className="form-group">
                <label>SALES</label>
                <div className="read-only-value">{editingProduct.sales}</div>
              </div>

              <div className="form-group">
                <label>TOTAL SALES</label>
                <div className="read-only-value">
                  {formatPrice(editingProduct.revenue)}
                </div>
              </div>

              <div className="form-group">
                <label>STATUS</label>
                <div className="read-only-value">
                  <span
                    className={`status-badge ${editingProduct.status
                      ?.toLowerCase()
                      .replace(/\s+/g, "-")}`}
                  >
                    {editingProduct.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => setShowModal(false)}
              >
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