const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_in_prod";

exports.register = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "username and password required" });
  }
  if (userModel.findByUsername(username)) {
    return res.status(409).json({ error: "Username already taken" });
  }
  const hash = await bcrypt.hash(password, 10);
  userModel.create(username, hash);
  res.status(201).json({ message: "User created" });
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const user = userModel.findByUsername(username);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: "7d"
  });
  res.json({ token, user: { id: user.id, username: user.username } });
};
