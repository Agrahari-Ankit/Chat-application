// models/Message.js
const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  username: String,
  text: String,
  time: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Message", messageSchema);
