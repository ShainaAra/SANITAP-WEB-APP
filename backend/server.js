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

            if (product.status?.toUpperCase() === "LOW STOCK") {
              try {
                await admin.messaging().send({
                  topic: "admins",
                  notification: {
                    title: "⚠️ Low Stock Alert",
                    body: `${product.name} is now LOW STOCK. Please restock.`
                  },
                  data: {
                      title: "⚠️ Low Stock Alert",
                      body: `${product.name} is now LOW STOCK. Please restock.`
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


/* =========================
   USERS ROUTES
========================= */

// Get users
app.get("/api/users", (req, res) => {
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
app.post("/api/users", (req, res) => {
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
app.delete("/api/users/:rfidNumber", (req, res) => {
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

app.post('/api/clear-balances', (req, res) => {
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
app.get("/api/transactions", (req, res) => {
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
