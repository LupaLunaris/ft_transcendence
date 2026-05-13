const mapModel = require("../models/mapModel");

exports.getAllPublic = (req, res) => {
  res.json(mapModel.getAllPublic());
};

exports.getMyMaps = (req, res) => {
  res.json(mapModel.getByUser(req.user.id));
};

exports.getMapById = (req, res) => {
  const map = mapModel.getById(req.params.id);
  if (!map) return res.status(404).json({ error: "Map not found" });
  const parsed = { ...map, grid: JSON.parse(map.grid) };
  res.json(parsed);
};

exports.createMap = (req, res) => {
  const { grid, name } = req.body;
  if (!grid) return res.status(400).json({ error: "grid required" });
  const map = mapModel.create(req.user.id, grid, name);
  res.status(201).json({ ...map, grid: JSON.parse(map.grid) });
};

exports.updateMap = (req, res) => {
  const { grid, name } = req.body;
  const existing = mapModel.getById(req.params.id);
  if (!existing) return res.status(404).json({ error: "Map not found" });
  if (existing.user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  mapModel.update(req.params.id, req.user.id, grid, name || existing.name);
  res.json(mapModel.getById(req.params.id));
};

exports.completeMap = (req, res) => {
  const existing = mapModel.getById(req.params.id);
  if (!existing) return res.status(404).json({ error: "Map not found" });
  if (existing.user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  mapModel.markCompleted(req.params.id, req.user.id);
  res.json({ message: "Map marked as completed" });
};

exports.publishMap = (req, res) => {
  const existing = mapModel.getById(req.params.id);
  if (!existing) return res.status(404).json({ error: "Map not found" });
  if (existing.user_id !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  if (!existing.creator_completed) return res.status(403).json({ error: "Complete your map before publishing" });
  mapModel.publish(req.params.id, req.user.id);
  res.json({ message: "Map published" });
};
