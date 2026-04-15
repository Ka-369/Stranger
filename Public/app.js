const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "/login.html";
}

const socket = io({
  auth: { token }
});

const messages = document.getElementById("messages");
const status = document.getElementById("status");

function add(text, type = "system") {
  const div = document.createElement("div");
  div.className = "message " + type;
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

socket.on("connect", () => {
  status.textContent = "CONNECTED TO SERVER";
});

socket.on("waiting", () => {
  status.textContent = "SEARCHING...";
  add("Looking for a stranger...", "system");
});

socket.on("matched", () => {
  status.textContent = "CONNECTED";
  add("Connected to a stranger", "system");
});

socket.on("message", (msg) => {
  add("Stranger: " + msg, "stranger");
});

function send() {
  const input = document.getElementById("msg");
  const text = input.value.trim();

  if (!text) return;

  socket.emit("message", text);
  add("You: " + text, "you");

  input.value = "";
}