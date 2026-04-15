const db = require("./db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { otpStore } = require("./otp");

exports.register = async (req, res) => {
  const { name, email, password, otp } = req.body;

  if (otpStore[email] !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  const hashed = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users (name,email,password) VALUES (?,?,?)",
    [name, email, hashed],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "User exists" });
      }

      delete otpStore[email];
      res.json({ message: "Registered" });
    }
  );
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE email=?",
    [email],
    async (err, user) => {
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(401).json({ message: "Wrong password" });
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

      res.json({ token });
    }
  );
};