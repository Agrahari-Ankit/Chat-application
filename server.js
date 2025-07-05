require("dotenv").config();  

const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const session = require("express-session");
const bcrypt = require("bcrypt");
const socketIo = require("socket.io");
const User = require("./models/User");
const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// MongoDB Atlas Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Connection Failed:", err));

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(session({ secret: "secret-key", resave: false, saveUninitialized: false }));
app.set("view engine", "ejs");

// Routes
app.get("/", (req, res) => {
  if (req.session.user) return res.redirect("/chat");
  res.redirect("/login");
});

app.get("/register", (req, res) => res.render("register"));

app.post("/register", async (req, res) => {
  const hashed = await bcrypt.hash(req.body.password, 10);
  try {
    await User.create({ username: req.body.username, password: hashed });
    res.redirect("/login");
  } catch {
    res.send("User already exists.");
  }
});

app.get("/login", (req, res) => res.render("login"));

app.post("/login", async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (user && await bcrypt.compare(req.body.password, user.password)) {
    req.session.user = user;
    res.redirect("/chat");
  } else {
    res.send("Invalid credentials");
  }
});

app.get("/chat", async (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  const messages = await Message.find().sort({ time: 1 }).limit(20);
  res.render("chat", { username: req.session.user.username, messages });
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// Socket.IO Setup
io.on("connection", (socket) => {
  socket.on("send_message", async (data) => {
    await Message.create({ username: data.username, text: data.message });
    io.emit("receive_message", data);
  });
});

// Start Server
server.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});
