const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const mapRoutes = require("./routes/mapRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/maps", mapRoutes);

module.exports = app;