const API_BASE_URL = 'http://localhost:5000/api';

// Product service functions
export const productService = {
  // Fetch all products from database
  async getProducts() {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      if (!response.ok) throw new Error('Failed to fetch');
      return await response.json();
    } catch (error) {
      console.error('Error fetching products:', error);
      return []; // Return empty array on error
    }
  },

  // Update product in database
  async updateProduct(id, productData) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData)
      });
      
      if (!response.ok) throw new Error('Failed to update');
      return await response.json();
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // Delete product from database
  async deleteProduct(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      return await response.json();
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }
};