import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ActionMenu.css';

export default function ActionMenu({ productId, onEdit, product }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showValidationAlert, setShowValidationAlert] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [formData, setFormData] = useState({
    name: '',
    price: null,
  });
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  // Update dropdown position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + 4,
        left: buttonRect.left + buttonRect.width / 2
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      // Check if click is outside button and dropdown
      if (
        buttonRef.current && 
        !buttonRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    // Only add listener when menu is open
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const handleEdit = () => {
    console.log('Edit clicked for product:', productId);
    setFormData({
      name: product?.name || '',
      price: product?.price || null,
    });
    setShowEditDialog(true);
    setIsOpen(false);
  };

  const handleConfirmEdit = () => {
    console.log('Confirm edit for product:', productId, formData);
    // Only edit if fields are not empty
    if (formData.name.trim() && formData.price !== null && formData.price !== '') {
      onEdit(productId, formData);
      setShowEditDialog(false);
    } else {
      // Show validation error
      setShowValidationAlert(true);
    }
  };



  const handlePriceChange = (e) => {
    const value = e.target.value;
    setFormData({
      ...formData,
      price: value === '' ? null : value
    });
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div className="action-menu-container">
        <button 
          ref={buttonRef}
          className="action-button" 
          onClick={toggleMenu}
          title="More options"
        >
          ⋯
        </button>
      </div>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="action-dropdown"
          style={{
            position: 'fixed',
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            transform: 'translateX(-50%)',
            zIndex: 9999
          }}
        >
          <button 
            type="button" 
            className="action-option edit" 
            onClick={handleEdit}
          >
            Edit
          </button>
        </div>,
        document.body
      )}

      {/* Edit Dialog */}
      {showEditDialog && (
        <div className="modal-overlay" onClick={() => setShowEditDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Product Details</h2>
              <button 
                className="modal-close" 
                onClick={() => setShowEditDialog(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form className="edit-form" onSubmit={(e) => e.preventDefault()}>
                {/* Product Name - Input field */}
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input 
                    type="text"
                    className="form-input"
                    placeholder="Enter a product name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                {/* Price */}
                <div className="form-group">
                  <label className="form-label">Price</label>
                  <input 
                    type="number"
                    className="form-input"
                    placeholder="Enter price"
                    value={formData.price === null ? '' : formData.price}
                    onChange={handlePriceChange}
                  />
                </div>

                {/* Sales - Read Only */}
                <div className="form-group">
                  <label className="form-label">Sales</label>
                  <input 
                    type="text"
                    className="form-input read-only"
                    value={product?.sales || 0}
                    readOnly
                  />
                </div>

                {/* Total Sales - Read Only */}
                <div className="form-group">
                  <label className="form-label">Total Sales</label>
                  <input 
                    type="text"
                    className="form-input read-only"
                    value={`${product?.revenue || '0.00'}`}
                    readOnly
                  />
                </div>

                {/* Status - Read Only */}
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <input 
                    type="text"
                    className="form-input read-only"
                    value={product?.status || ''}
                    readOnly
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowEditDialog(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleConfirmEdit}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Alert Dialog */}
      {showValidationAlert && (
        <div className="alert-dialog-overlay" onClick={() => setShowValidationAlert(false)}>
          <div className="alert-dialog-content" onClick={(e) => e.stopPropagation()}>
            <div className="alert-dialog-header">
              <h3 className="alert-dialog-title">Please fill in all fields</h3>
            </div>
            <div className="alert-dialog-footer">
              <button 
                className="btn btn-primary"
                onClick={() => setShowValidationAlert(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}