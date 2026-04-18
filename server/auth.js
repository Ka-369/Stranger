const db = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { otpStore } = require("./otp");

// REGISTER
exports.register = async (req, res) => {
  const { name, email, password, otp } = req.body;

  console.log("REGISTER HIT:", name, email);

  if (otpStore[email] !== otp) {
    console.log("OTP FAILED");
    return res.status(400).json({ message: "Invalid OTP" });
  }

  const hashed = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
    [name, email, hashed],
    (err) => {
      if (err) {
        console.log("DB ERROR:", err);
        return res.status(400).json({ message: "User already exists" });
      }

      console.log("USER INSERTED");
      delete otpStore[email];
      res.json({ message: "Registered" });
    }
  );
};


// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {

      if (err) {
        console.log("DB ERROR:", err);
        return res.status(500).json({ message: "Server error" });
      }

      if (results.length === 0) {
        return res.status(400).json({ message: "User not found" });
      }

      const user = results[0];

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(401).json({ message: "Wrong password" });
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

      res.json({ token });
    }
  );
};