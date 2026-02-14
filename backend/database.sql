-- Create database
CREATE DATABASE IF NOT EXISTS sanitap_db;

-- Use the database
USE sanitap_db;

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price VARCHAR(50) NOT NULL,
  sales INT NOT NULL,
  revenue VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL
);

-- Insert sample data
INSERT INTO products (name, price, sales, revenue, status) VALUES
('Menstrual Pads', '₱ 10.00', 27, '₱ 10.00', 'Low Stock'),
('Wet Wipes', '₱ 10.00', 14, '₱ 10.00', 'Low Stock'),
('Tissue', '₱ 10.00', 21, '₱ 10.00', 'Low Stock'),
('Soap', '₱ 15.00', 9, '₱ 10.00', 'In Stock');