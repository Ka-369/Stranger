const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");

const otpStore = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendOTP = async (req, res) => {
  const { email } = req.body;

  const otp = otpGenerator.generate(6, {
    digits: true,
    alphabets: false,
    specialChars: false
  });

  otpStore[email] = otp;

  await transporter.sendMail({
    to: email,
    subject: "OTP",
    text: `Your OTP is ${otp}`
  });

  res.json({ message: "OTP sent" });
};

exports.verifyOTP = (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] === otp) {
    return res.json({ success: true });
  }

  res.status(400).json({ success: false });
};

exports.otpStore = otpStore;