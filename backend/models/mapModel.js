const db = require("../db");

exports.getAllPublic = () =>
  db.prepare("SELECT id, user_id, name, created_at FROM maps WHERE is_public = 1").all();

exports.getByUser = (userId) =>
  db.prepare("SELECT * FROM maps WHERE user_id = ?").all(userId);

exports.getById = (id) =>
  db.prepare("SELECT * FROM maps WHERE id = ?").get(id);

exports.create = (userId, grid, name = "My World") => {
  const result = db
    .prepare("INSERT INTO maps (user_id, grid, name) VALUES (?, ?, ?)")
    .run(userId, JSON.stringify(grid), name);
  return exports.getById(result.lastInsertRowid);
};

exports.update = (id, userId, grid, name) =>
  db
    .prepare("UPDATE maps SET grid = ?, name = ? WHERE id = ? AND user_id = ?")
    .run(JSON.stringify(grid), name, id, userId);

exports.markCompleted = (id, userId) =>
  db.prepare("UPDATE maps SET creator_completed = 1 WHERE id = ? AND user_id = ?").run(id, userId);

exports.publish = (id, userId) =>
  db.prepare("UPDATE maps SET is_public = 1 WHERE id = ? AND user_id = ? AND creator_completed = 1").run(id, userId);
