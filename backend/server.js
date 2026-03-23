import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import dotenv from 'dotenv';
import process from 'process';
import admin from 'firebase-admin';
import serviceAccount from './firebase-key.json' assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sanitap_db'
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection error:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

// FCM Subscription Route
app.post("/api/subscribe", async (req, res) => {
  const { token } = req.body;

  await admin.messaging().subscribeToTopic(token, "admins");

  res.json({ status: "subscribed" });
});

/* =========================
   PRODUCTS ROUTES
========================= */

// Get all products
app.get("/api/products", (req, res) => {
  const sql = `
    SELECT id, product_code, name, price, sales, revenue, status
    FROM products
    ORDER BY product_code
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }

    const formatted = results.map(p => ({
      id: p.id,
      product_code: p.product_code,
      name: p.name,
      price: parseFloat(p.price),
      sales: parseInt(p.sales),
      revenue: parseFloat(p.revenue),
      status: p.status
    }));

    res.json(formatted);
  });
});

// Add product
app.post("/api/products", (req, res) => {
  const { product_code, name, price, sales, revenue, status } = req.body;

  const sql =
    "INSERT INTO products (product_code,name,price,sales,revenue,status) VALUES (?,?,?,?,?,?)";

  db.query(sql, [product_code, name, price, sales, revenue, status], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json({ message: "Product added", id: result.insertId });
  });
});

// Update product
app.put("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const { product_code, name, price, sales, revenue, status } = req.body;

  const sql =
    "UPDATE products SET product_code=?, name=?, price=?, sales=?, revenue=?, status=? WHERE id=?";

  db.query(sql, [product_code, name, price, sales, revenue, status, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json({ message: "Product updated successfully" });
  });
});

// Delete product
app.delete("/api/products/:id", (req, res) => {
  db.query("DELETE FROM products WHERE id=?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json({ message: "Product deleted successfully" });
  });
});

// ============ USERS ROUTES ============
// Get all users
app.get('/api/users', (req, res) => {
  // CORRECTED: Using rfidNumber (with 'i') as shown in your screenshot
  const query = 'SELECT rfidNumber, studentNumber, studentName, course, totalPayment FROM users ORDER BY id DESC';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.json({ status: "ERROR" });
    }
    
    // Format the results to match what your frontend expects
    const formattedResults = results.map(user => ({
      rfidNumber: user.rfidNumber,
      idNumber: user.studentNumber,
      name: user.studentName,
      course: user.course,
      totalPayment: `₱ ${parseFloat(user.totalPayment || 0).toFixed(2)}`
    }));
    
    res.json(formattedResults);
  });
});

// Search users
app.get('/api/users/search', (req, res) => {
  const { query } = req.query;
  const searchQuery = `%${query}%`;
  
  // CORRECTED: Using rfidNumber in WHERE clause
  const sql = 'SELECT rfidNumber, studentNumber, studentName, course, totalPayment FROM users WHERE rfidNumber LIKE ? OR studentNumber LIKE ? OR studentName LIKE ? ORDER BY id DESC';
  
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
      totalPayment: `₱ ${parseFloat(user.totalPayment || 0).toFixed(2)}`
    }));

    res.json(formatted);
  });
});

// Add user
app.post("/api/users", (req, res) => {
  const { rfidNumber, idNumber, name, course } = req.body;
  
  // Check if RFID or Student Number already exists
  // CORRECTED: Using rfidNumber in check query
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
    
    // Insert new user with 0.00 initial payment
    // CORRECTED: Using rfidNumber in insert query
    const insertQuery = 'INSERT INTO users (rfidNumber, studentNumber, studentName, course, totalPayment) VALUES (?, ?, ?, ?, 0.00)';
    db.query(insertQuery, [rfidNumber, idNumber, name, course], (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.status(201).json({ 
        message: 'User added successfully',
        id: result.insertId
      });
    });
  });
});

// Delete user
app.delete('/api/users/:rfidNumber', (req, res) => {
  const { rfidNumber } = req.params;
  // CORRECTED: Using rfidNumber in delete query
  const query = 'DELETE FROM users WHERE rfidNumber = ?';
  
  db.query(query, [rfidNumber], (err, result) => {
    if (err) {
      console.error("SELECT ERROR:", err);
      return res.status(500).json({ status: "ERROR" });
    }

    // Step 2: Only clear users that:
    // - Have balance > 0 OR
    // - Have balance = 0 but NOT yet marked as cleared
    const usersToClear = results.filter(user => {
      const balance = parseFloat(user.totalPayment);
      return balance > 0 || (balance === 0 && user.balance_cleared_at === null);
    });

    if (usersToClear.length === 0) {
      return res.json({
        status: "NOTHING_TO_CLEAR"
      });
    }

    const rfidsToClear = usersToClear.map(u => u.rfidNumber);

    // Step 3: Update ALL selected valid users
    const updateQuery = `
      UPDATE users
      SET totalPayment = 0,
          balance_cleared_at = NOW()
      WHERE rfidNumber IN (?)
    `;

    db.query(updateQuery, [rfidsToClear], (updateErr, result) => {
      if (updateErr) {
        console.error("UPDATE ERROR:", updateErr);
        return res.status(500).json({ status: "ERROR" });
      }

      res.json({
        status: "SUCCESS",
        clearedCount: result.affectedRows
      });
    });
  });
});

// Update user balance
app.put('/api/users/:rfidNumber/balance', (req, res) => {
  const { rfidNumber } = req.params;
  const { totalPayment } = req.body;
  
  const query = 'UPDATE users SET totalPayment = ? WHERE rfidNumber = ?';
  
  db.query(query, [totalPayment, rfidNumber], (err, result) => {
    if (err) {
      console.error('Error updating balance:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ message: 'Balance updated successfully' });
  });
});


/* =========================
   TEST
========================= */

app.get("/api/test", (req, res) => {
  res.json({ message: "Server is working!" });
});


app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
