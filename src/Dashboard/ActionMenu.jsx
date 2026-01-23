import React, { useState, useRef, useEffect } from 'react';
import './ActionMenu.css';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function ActionMenu({ productId, onEdit, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
    setShowEditDialog(true);
    setIsOpen(false);
  };

  const handleConfirmEdit = () => {
    onEdit(productId);
    setShowEditDialog(false);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
    setIsOpen(false);
  };

  const handleConfirmDelete = () => {
    onDelete(productId);
    setShowDeleteDialog(false);
  };

  return (
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

      {/* Edit Dialog */}
      {showEditDialog && (
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Make changes to the product details below.
              </DialogDescription>
            </DialogHeader>
            <div className="edit-form">
              {/* Add your edit form fields here */}
              <p>Product ID: {productId}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmEdit}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Product</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this product? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
