import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import dotenv from 'dotenv';
import process from 'process';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sanitap_db'
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Routes
app.get('/api/products', (req, res) => {
  const query = 'SELECT * FROM products';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(results);
  });
});

app.post('/api/products', (req, res) => {
  const { name, price, sales, revenue, status } = req.body;
  const query = 'INSERT INTO products (name, price, sales, revenue, status) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [name, price, sales, revenue, status], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: result.insertId, ...req.body });
  });
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { name, price, sales, revenue, status } = req.body;
  const query = 'UPDATE products SET name = ?, price = ?, sales = ?, revenue = ?, status = ? WHERE id = ?';
  db.query(query, [name, price, sales, revenue, status, id], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json({ message: 'Product updated successfully' });
  });
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM products WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }
    res.json({ message: 'Product deleted successfully' });
  });
});

// ============ USERS ROUTES ============
// Get all users
app.get('/api/users', (req, res) => {
  // Include balance_cleared_at field
  const query = 'SELECT rfidNumber, studentNumber, studentName, course, totalPayment, balance_cleared_at FROM users ORDER BY id DESC';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Format the results to match what your frontend expects
    const formattedResults = results.map(user => ({
      rfidNumber: user.rfidNumber,
      idNumber: user.studentNumber,
      name: user.studentName,
      course: user.course,
      totalPayment: `₱ ${parseFloat(user.totalPayment || 0).toFixed(2)}`,
      wasCleared: user.balance_cleared_at !== null && parseFloat(user.totalPayment || 0) === 0
    }));
    
    res.json(formattedResults);
  });
});

// Search users
app.get('/api/users/search', (req, res) => {
  const { query } = req.query;
  const searchQuery = `%${query}%`;
  
  // Include balance_cleared_at field
  const sql = 'SELECT rfidNumber, studentNumber, studentName, course, totalPayment, balance_cleared_at FROM users WHERE rfidNumber LIKE ? OR studentNumber LIKE ? OR studentName LIKE ? ORDER BY id DESC';
  
  db.query(sql, [searchQuery, searchQuery, searchQuery], (err, results) => {
    if (err) {
      console.error('Search error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    
    // Format the results
    const formattedResults = results.map(user => ({
      rfidNumber: user.rfidNumber,
      idNumber: user.studentNumber,
      name: user.studentName,
      course: user.course,
      totalPayment: `₱ ${parseFloat(user.totalPayment || 0).toFixed(2)}`,
      wasCleared: user.balance_cleared_at !== null && parseFloat(user.totalPayment || 0) === 0
    }));
    
    res.json(formattedResults);
  });
});

// Add new user
app.post('/api/users', (req, res) => {
  const { rfidNumber, idNumber, name, course } = req.body;
  
  // Check if RFID or Student Number already exists
  const checkQuery = 'SELECT * FROM users WHERE rfidNumber = ? OR studentNumber = ?';
  db.query(checkQuery, [rfidNumber, idNumber], (checkErr, checkResults) => {
    if (checkErr) {
      res.status(500).json({ error: checkErr.message });
      return;
    }
    
    if (checkResults.length > 0) {
      res.status(400).json({ message: 'RFID number or Student number already exists' });
      return;
    }
    
    // Insert new user with 0.00 initial payment and NULL balance_cleared_at
    const insertQuery = 'INSERT INTO users (rfidNumber, studentNumber, studentName, course, totalPayment, balance_cleared_at) VALUES (?, ?, ?, ?, 0.00, NULL)';
    db.query(insertQuery, [rfidNumber, idNumber, name, course], (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ 
        message: 'User added successfully'
      });
    });
  });
});

// Delete user
app.delete('/api/users/:rfidNumber', (req, res) => {
  const { rfidNumber } = req.params;
  const query = 'DELETE FROM users WHERE rfidNumber = ?';
  
  db.query(query, [rfidNumber], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ message: 'User deleted successfully' });
  });
});

// Update user balance (with tracking for cleared balances)
app.put('/api/users/:rfidNumber/balance', (req, res) => {
  const { rfidNumber } = req.params;
  const { totalPayment } = req.body;
  
  // First, get the current user to check if they had a balance
  const getUserQuery = 'SELECT totalPayment FROM users WHERE rfidNumber = ?';
  
  db.query(getUserQuery, [rfidNumber], (getErr, getResults) => {
    if (getErr) {
      console.error('Error fetching user:', getErr);
      res.status(500).json({ error: getErr.message });
      return;
    }
    
    if (getResults.length === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    const currentBalance = parseFloat(getResults[0].totalPayment);
    const newBalance = parseFloat(totalPayment);
    
    // If we're clearing the balance (setting to 0) and the current balance was > 0
    if (newBalance === 0 && currentBalance > 0) {
      // Update balance and set cleared timestamp
      const updateQuery = 'UPDATE users SET totalPayment = ?, balance_cleared_at = NOW() WHERE rfidNumber = ?';
      db.query(updateQuery, [totalPayment, rfidNumber], (updateErr) => {
        if (updateErr) {
          console.error('Error updating balance:', updateErr);
          res.status(500).json({ error: updateErr.message });
          return;
        }
        res.json({ 
          message: 'Balance cleared successfully',
          cleared: true 
        });
      });
    } else {
      // Just update balance without clearing timestamp
      const updateQuery = 'UPDATE users SET totalPayment = ? WHERE rfidNumber = ?';
      db.query(updateQuery, [totalPayment, rfidNumber], (updateErr) => {
        if (updateErr) {
          console.error('Error updating balance:', updateErr);
          res.status(500).json({ error: updateErr.message });
          return;
        }
        res.json({ 
          message: 'Balance updated successfully',
          cleared: false 
        });
      });
    }
  });
});

// Add a test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});