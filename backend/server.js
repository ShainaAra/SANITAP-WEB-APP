import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import dotenv from 'dotenv';
import process from 'process';
import admin from 'firebase-admin';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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
  host: process.env.DB_HOST || '127.0.0.1',
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

// Log in route

app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      message: "Username and password are required"
    });
  }

  const sql = "SELECT * FROM admins WHERE username = ?";

  db.query(sql, [username], async (err, results) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (results.length === 0) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    const adminUser = results[0];

    const isMatch = await bcrypt.compare(password, adminUser.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid username or password"
      });
    }

    const token = jwt.sign(
      {
        id: adminUser.id,
        username: adminUser.username
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      message: "Login successful",
      token,
      admin: {
        id: adminUser.id,
        username: adminUser.username
      }
    });
  });
});

// JWT MIDDLEWARE (PROTECT ADMIN ROUTES)

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if header exists
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Access denied. No token provided."
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next(); // allow access
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token"
    });
  }
};

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
app.get("/api/products", verifyToken, (req, res) => {
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
app.post("/api/products", verifyToken, (req, res) => {
  const { product_code, name, price, sales, revenue, status } = req.body;

  const sql =
    "INSERT INTO products (product_code,name,price,sales,revenue,status) VALUES (?,?,?,?,?,?)";

  db.query(sql, [product_code, name, price, sales, revenue, status], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json({ message: "Product added", id: result.insertId });
  });
});

// Update product
app.put("/api/products/:id", verifyToken, (req, res) => {
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
app.delete("/api/products/:id", verifyToken, (req, res) => {
  db.query("DELETE FROM products WHERE id=?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json({ message: "Product deleted successfully" });
  });
});

// Restock product
app.post('/restock', (req, res) => {

    const product = req.body.product;

    const sql = `
    UPDATE products
    SET servo_rotation = 0,
        status = 'IN STOCK'
    WHERE product_code = ?
    `;

    db.query(sql, [product], (err,result)=>{
        if(err){
            res.json({status:"ERROR"});
        }else{
            res.json({status:"RESTOCKED"});
        }
    });

});

// Dashboard stats
app.get("/api/dashboard-stats", verifyToken, (req, res) => {
  const sql = `
    SELECT 
      COUNT(*) AS totalProducts,
      SUM(CASE WHEN status = 'LOW STOCK' THEN 1 ELSE 0 END) AS lowStock,
      SUM(revenue) AS totalSales
    FROM products
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Stats error:", err);
      return res.status(500).json({ error: err.message });
    }

    const data = results[0];

    res.json({
      totalProducts: data.totalProducts || 0,
      lowStock: data.lowStock || 0,
      totalSales: parseFloat(data.totalSales || 0)
    });
  });
});


/* =========================
   RFID VALIDATION
========================= */

app.get("/api/check-rfid", (req, res) => {
  const uid = req.query.uid;

  if (!uid) {
    return res.json({ status: "ERROR", message: "No UID provided" });
  }

  db.query("CALL ValidateRFID(?)", [uid], (err, result) => {
    if (err) {
      console.error(err);
      return res.json({ status: "ERROR" });
    }

    if (result[0].length > 0) {
      res.json(result[0][0]);
    } else {
      res.json({ status: "INVALID" });
    }
  });
});


/* =========================
   PROCESS PURCHASE (RFID MACHINE)
========================= */

app.post("/api/purchase", (req, res) => {
  const { rfid, product_code } = req.body;

  if (!rfid || !product_code) {
    return res.json({ status: "ERROR", message: "Missing data" });
  }

  db.query(
    "CALL ProcessPurchase(?,?)",
    [rfid, product_code],
    async (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ status: "ERROR" });
      }

      // ✅ AFTER PURCHASE → CHECK PRODUCT STATUS
      db.query(
        "SELECT name, status FROM products WHERE product_code=?",
        [product_code],
        async (err2, productResult) => {
          if (!err2 && productResult.length > 0) {
            const product = productResult[0];

            if (product.status?.trim().toUpperCase() === "LOW STOCK") {
              try {
                const title = "Low Stock Alert";
                const productName = product.name;
                const message = "is now LOW STOCK. Please restock.";

                // ✅ Save to database
                db.query(
                  `INSERT INTO notifications (title, product_name, message, type, is_read)
                  VALUES (?, ?, ?, ?, 0)`,
                  [title, productName, message, "low_stock"],
                  (insertErr) => {
                    if (insertErr) {
                      console.error("❌ Notification save error:", insertErr);
                    }
                  }
                );

                // ✅ Send FCM
                await admin.messaging().send({
                  topic: "admins",
                  data: {
                    title,
                    product: productName,
                    message,
                    url: "http://localhost:5173/"
                  }
                });

                console.log("✅ LOW STOCK notification sent");
              } catch (error) {
                console.error("❌ Firebase error:", error);
              }
            }
          }
        }
      );

      res.json(result[0][0]);
    }
  );
});

// Get notifications
app.get("/api/notifications", verifyToken, (req, res) => {
  const sql = `
    SELECT id, title, product_name, message, type, is_read, created_at
    FROM notifications
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Fetch notifications error:", err);
      return res.status(500).json({ error: err.message });
    }

    res.json(results);
  });
});

// Mark notification as read
app.put("/api/notifications/:id/read", verifyToken, (req, res) => {
  const { id } = req.params;

  db.query(
    "UPDATE notifications SET is_read = 1 WHERE id = ?",
    [id],
    (err) => {
      if (err) {
        console.error("❌ Mark read error:", err);
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: "Notification marked as read" });
    }
  );
});

// Mark all notifications as read
app.put("/api/notifications/read-all", verifyToken, (req, res) => {
  db.query(
    "UPDATE notifications SET is_read = 1 WHERE is_read = 0",
    (err) => {
      if (err) {
        console.error("❌ Mark all read error:", err);
        return res.status(500).json({ error: err.message });
      }

      res.json({ message: "All notifications marked as read" });
    }
  );
});

// Get product status (for restock)
app.get("/api/product-status", (req, res) => {
  const { product } = req.query;

  if (!product) {
    return res.status(400).json({ status: "ERROR", message: "Missing product" });
  }

  db.query(
    "SELECT status FROM products WHERE product_code = ? LIMIT 1",
    [product],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ status: "ERROR" });
      }

      if (result.length === 0) {
        return res.status(404).json({ status: "ERROR", message: "Product not found" });
      }

      return res.json({
        product,
        status: result[0].status
      });
    }
  );
});


/* =========================
   USERS ROUTES
========================= */

// Search users
app.get("/api/users/search", verifyToken, (req, res) => {
  const query = (req.query.query || "").trim();

  const baseSql = `
    SELECT rfidNumber, studentNumber, studentName, course, totalPayment, balance_cleared_at
    FROM users
  `;

  if (!query) {
    const sql = `${baseSql} ORDER BY id DESC`;

    return db.query(sql, (err, results) => {
      if (err) {
        console.error("Search users error:", err);
        return res.status(500).json({ error: err.message });
      }

      const formatted = results.map((user) => ({
        rfidNumber: user.rfidNumber,
        idNumber: user.studentNumber,
        name: user.studentName,
        course: user.course,
        totalPayment: parseFloat(user.totalPayment) || 0,
        wasCleared: user.balance_cleared_at !== null
      }));

      res.json(formatted);
    });
  }

  const searchTerm = `%${query}%`;

  const sql = `
    SELECT rfidNumber, studentNumber, studentName, course, totalPayment, balance_cleared_at
    FROM users
    WHERE rfidNumber LIKE ?
       OR studentNumber LIKE ?
       OR studentName LIKE ?
       OR course LIKE ?
    ORDER BY id DESC
  `;

  db.query(
    sql,
    [searchTerm, searchTerm, searchTerm, searchTerm],
    (err, results) => {
      if (err) {
        console.error("Search users error:", err);
        return res.status(500).json({ error: err.message });
      }

      const formatted = results.map((user) => ({
        rfidNumber: user.rfidNumber,
        idNumber: user.studentNumber,
        name: user.studentName,
        course: user.course,
        totalPayment: parseFloat(user.totalPayment) || 0,
        wasCleared: user.balance_cleared_at !== null
      }));

      res.json(formatted);
    }
  );
});

// Get users
app.get("/api/users", verifyToken, (req, res) => {
  const sql =
    "SELECT rfidNumber, studentNumber, studentName, course, totalPayment, balance_cleared_at FROM users ORDER BY id DESC";

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    const formatted = results.map((user) => ({
      rfidNumber: user.rfidNumber,
      idNumber: user.studentNumber,
      name: user.studentName,
      course: user.course,
      totalPayment: parseFloat(user.totalPayment),
      wasCleared: user.balance_cleared_at !== null
    }));

    res.json(formatted);
  });
});

// Add user
app.post("/api/users", verifyToken, (req, res) => {
  const { rfidNumber, idNumber, name, course } = req.body;

  const check = "SELECT * FROM users WHERE rfidNumber=? OR studentNumber=?";

  db.query(check, [rfidNumber, idNumber], (err, results) => {
    if (results.length > 0) {
      return res.status(400).json({
        message: "RFID or Student number already exists"
      });
    }

    const insert =
      "INSERT INTO users (rfidNumber, studentNumber, studentName, course, totalPayment, balance_cleared_at) VALUES (?,?,?,?,0.00, NULL)";

    db.query(insert, [rfidNumber, idNumber, name, course], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({ message: "User added successfully" });
    });
  });
});

// Delete user
app.delete("/api/users/:rfidNumber", verifyToken, (req, res) => {
  db.query(
    "DELETE FROM users WHERE rfidNumber=?",
    [req.params.rfidNumber],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({ message: "User deleted successfully" });
    }
  );
});

/* =========================
   CLEAR MULTIPLE BALANCES
========================= */

app.post('/api/clear-balances', verifyToken, (req, res) => {
  const { rfids } = req.body;

  if (!rfids || rfids.length === 0) {
    return res.status(400).json({
      status: "ERROR",
      message: "No users provided"
    });
  }

  // Step 1: Get ALL selected users (not just > 0)
  const selectQuery = `
    SELECT rfidNumber, totalPayment, balance_cleared_at
    FROM users 
    WHERE rfidNumber IN (?)
  `;

  db.query(selectQuery, [rfids], (err, results) => {
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

/* =========================
   TRANSACTIONS
========================= */

// Get transaction history
app.get("/api/transactions", verifyToken, (req, res) => {
  const sql = `
  SELECT t.id, u.studentName, t.rfid_number, t.product_name,
         t.price, t.transaction_date
  FROM transactions t
  JOIN users u ON t.user_id = u.id
  ORDER BY t.transaction_date DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json(results);
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
