const db = require("../db");

exports.findByUsername = (username) =>
  db.prepare("SELECT * FROM users WHERE username = ?").get(username);

exports.findById = (id) =>
  db.prepare("SELECT id, username, created_at FROM users WHERE id = ?").get(id);

exports.create = (username, hashedPassword) =>
  db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run(username, hashedPassword);
