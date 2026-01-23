import React, { useState, useRef, useEffect } from 'react';
import './ActionMenu.css';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ActionMenu({ productId, onEdit, onDelete, product }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: product?.name || '',
    price: product?.price || '',
  });
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleEdit = () => {
    console.log('Edit clicked for product:', productId);
    setFormData({
      name: product?.name || '',
      price: product?.price || '',
    });
    setShowEditDialog(true);
    setIsOpen(false);
  };

  const handleConfirmEdit = () => {
    console.log('Confirm edit for product:', productId, formData);
    onEdit(productId, formData);
    setShowEditDialog(false);
  };

  const handleDelete = () => {
    console.log('Delete clicked for product:', productId);
    setShowDeleteDialog(true);
    setIsOpen(false);
  };

  const handleConfirmDelete = () => {
    console.log('Confirm delete for product:', productId);
    onDelete(productId);
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="action-menu-container" ref={menuRef}>
        <button 
          className="action-button" 
          onClick={() => setIsOpen(!isOpen)}
          title="More options"
        >
          ⋯
        </button>
        
        {isOpen && (
          <div className="action-dropdown">
            <button className="action-option edit" onClick={handleEdit}>
              ✏️ Edit
            </button>
            <button className="action-option delete" onClick={handleDelete}>
              🗑️ Delete
            </button>
          </div>
        )}
      </div>

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
              <form className="edit-form">
                {/* Product Name - Select */}
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <Select 
                    value={formData.name} 
                    onValueChange={(value) => setFormData({...formData, name: value})}
                  >
                    <SelectTrigger className="form-input select-trigger-custom">
                      <SelectValue placeholder="Select a Product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="menstrual pads">Menstrual Pads</SelectItem>
                      <SelectItem value="tissue">Tissue</SelectItem>
                      <SelectItem value="soap">Soap</SelectItem>
                      <SelectItem value="wet wipes">Wet Wipes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price */}
                <div className="form-group">
                  <label className="form-label">Price</label>
                  <input 
                    type="number"
                    className="form-input"
                    placeholder="Enter Price"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
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
                    value={`₱ ${product?.revenue || '0.00'}`}
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

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="modal-overlay" onClick={() => setShowDeleteDialog(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Product</h2>
              <button 
                className="modal-close"
                onClick={() => setShowDeleteDialog(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete this product?</p>
              <p>This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowDeleteDialog(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleConfirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
