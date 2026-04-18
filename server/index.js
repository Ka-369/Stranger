require("dotenv").config();
require("./db");

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const { register, login } = require("./auth");
const { sendOTP, verifyOTP } = require("./otp");

const app = express();
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

let waiting = null;


// SOCKET AUTH
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const user = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = user;
    next();
  } catch {
    next(new Error("Auth failed"));
  }
});

// CHAT
io.on("connection", (socket) => {
  console.log("CONNECTED:", socket.id);

  if (waiting) {
    console.log("MATCHING USERS");

    socket.partner = waiting;
    waiting.partner = socket;

    socket.emit("matched");
    waiting.emit("matched");

    waiting = null;
  } else {
    console.log("WAITING USER");
    waiting = socket;
    socket.emit("waiting");
  }

  socket.on("message", (msg) => {
    console.log("MESSAGE RECEIVED:", msg);

    if (socket.partner) {
      console.log("SENDING TO PARTNER");
      socket.partner.emit("message", msg);
    } else {
      console.log("NO PARTNER FOUND");
    }
  });
});

// ROUTES
app.post("/api/register", register);
app.post("/api/login", login);
app.post("/api/send-otp", sendOTP);
app.post("/api/verify-otp", verifyOTP);

// STATIC
const path = require("path");


app.use(express.static(path.join(__dirname, "../public")));

// fallback route (SAFE)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../public/login.html"));
});
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});