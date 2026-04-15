const db = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { otpStore } = require("./otp");

// REGISTER
exports.register = async (req, res) => {
  const { name, email, password, otp } = req.body;

  if (otpStore[email] !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  const hashed = await bcrypt.hash(password, 10);

  try {
    db.prepare(
      "INSERT INTO users (name,email,password) VALUES (?,?,?)"
    ).run(name, email, hashed);

    delete otpStore[email];
    res.json({ message: "Registered" });
  } catch {
    res.status(400).json({ message: "User already exists" });
  }
};


// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare(
    "SELECT * FROM users WHERE email=?"
  ).get(email);

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.status(401).json({ message: "Wrong password" });
  }

  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

  res.json({ token });
};